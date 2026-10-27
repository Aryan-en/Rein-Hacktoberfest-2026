import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";
import { ImageAnalysisUnavailableError, investigate, type InvestigateInput, type PipelineDeps } from "./analysis/pipeline";
import type { AppConfig } from "./config/env";
import { log } from "./lib/logger";
import { AuthService } from "./auth/service";
import { clearCookie, isSecureRequest, parseCookies, SESSION_COOKIE, sessionCookie, signSession, verifySession } from "./auth/session";
import { FileUserStore, type User, type UserStore } from "./auth/store";
import { validateImage } from "./security/image-validate";
import { clientKey, RateLimiter } from "./security/rate-limit";
import type { AiProvider } from "./types/ai";
import type { ApiError, ApiErrorCode } from "./types/investigation";
import { MAX_URL_CHARS } from "./validation/limits";
import { AnalyzeRequestSchema } from "./validation/request";

export const VERSION = "0.1.0";

export interface AppDeps {
  config: AppConfig;
  provider: AiProvider | null;
  limiter?: RateLimiter;
  /** Account store. Defaults to a JSON file at config.authDataFile. */
  userStore?: UserStore;
  /** Test seam to replace the pipeline. */
  investigateFn?: typeof investigate;
}

class HttpError extends Error {
  constructor(public status: number, public code: ApiErrorCode, message: string, public extra: Partial<ApiError["error"]> = {}) {
    super(message);
  }
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
  "Cross-Origin-Resource-Policy": "same-site",
} as const;

export function createApp(deps: AppDeps) {
  const { config } = deps;
  const limiter = deps.limiter ?? new RateLimiter({ perMinute: config.rateLimitPerMin, dailyCap: config.dailyCap });
  const userLimiter = new RateLimiter({ perMinute: config.userRateLimitPerMin, dailyCap: config.dailyCap });
  const run = deps.investigateFn ?? investigate;
  const auth = new AuthService(deps.userStore ?? new FileUserStore(config.authDataFile ? resolve(config.authDataFile) : null));
  // Without AUTH_SECRET a random per-process secret is used: sessions simply end when the server restarts.
  const authSecret = config.authSecret ?? randomBytes(32).toString("hex");
  const sessionTtl = config.sessionTtlDays * 86_400;
  const maxBody = Math.ceil((config.maxImageBytes * 4) / 3) + 65_536;
  const pipelineDeps: PipelineDeps = {
    provider: deps.provider,
    config: {
      primaryModel: config.primaryModel,
      fallbackModel: config.fallbackModel,
      visionModels: [config.visionModel, config.visionFallbackModel].filter((m): m is string => !!m),
      maxTextChars: config.maxTextChars,
      modelTimeoutMs: config.modelTimeoutMs,
      jsonMode: config.jsonMode,
    },
  };

  function send(res: ServerResponse, status: number, body: unknown, headers: Record<string, string | number> = {}): void {
    const payload = JSON.stringify(body);
    res.writeHead(status, { ...SECURITY_HEADERS, "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(payload), ...headers });
    res.end(payload);
  }

  function sendError(res: ServerResponse, requestId: string, e: HttpError): void {
    const body: ApiError = { error: { code: e.code, message: e.message, requestId, ...e.extra } };
    const headers: Record<string, string | number> = {};
    if (e.extra.retryAfterSeconds) headers["Retry-After"] = e.extra.retryAfterSeconds;
    if (e.status === 413) headers["Connection"] = "close";
    send(res, e.status, body, headers);
  }

  function applyCors(req: IncomingMessage, res: ServerResponse): void {
    const origin = req.headers.origin;
    if (origin && (config.corsOrigins.includes("*") || config.corsOrigins.includes(origin))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Credentials", "true");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Expose-Headers", "X-Request-Id, Retry-After");
      res.setHeader("Access-Control-Max-Age", "600");
    }
  }

  function readBody(req: IncomingMessage, max = maxBody): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const declared = Number(req.headers["content-length"]);
      if (Number.isFinite(declared) && declared > max) return reject(new HttpError(413, "payload_too_large", "Request body is too large."));
      const chunks: Buffer[] = [];
      let size = 0;
      req.on("data", (c: Buffer) => {
        size += c.length;
        if (size > max) {
          chunks.length = 0;
          reject(new HttpError(413, "payload_too_large", "Request body is too large."));
          req.pause();
          return;
        }
        chunks.push(c);
      });
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", () => reject(new HttpError(400, "invalid_request", "Could not read the request body.")));
    });
  }

  function currentUser(req: IncomingMessage): User | null {
    return auth.user(verifySession(authSecret, parseCookies(req.headers.cookie)[SESSION_COOKIE]));
  }

  async function readJson(req: IncomingMessage): Promise<unknown> {
    const ctype = (req.headers["content-type"] ?? "").split(";")[0]!.trim().toLowerCase();
    if (ctype !== "application/json") throw new HttpError(415, "unsupported_media_type", "Content-Type must be application/json.");
    const raw = await readBody(req, 16_384);
    try {
      return JSON.parse(raw.toString("utf8"));
    } catch {
      throw new HttpError(400, "invalid_request", "Request body is not valid JSON.");
    }
  }

  const failCode = (r: { status: number; code: string }) => r.code as ApiErrorCode;

  async function authRoute(req: IncomingMessage, res: ServerResponse, requestId: string, path: string, method: string): Promise<void> {
    const secure = isSecureRequest(req);
    const ip = clientKey(req.headers, req.socket.remoteAddress, config.proxyHops);
    if (path === "/api/auth/me") {
      if (method !== "GET") throw new HttpError(405, "method_not_allowed", "Use GET.");
      const u = currentUser(req);
      return send(res, 200, { user: u ? { id: u.id, email: u.email, name: u.name, createdAt: u.createdAt } : null });
    }
    if (path === "/api/auth/logout") {
      if (method !== "POST") throw new HttpError(405, "method_not_allowed", "Use POST.");
      return send(res, 200, { ok: true }, { "Set-Cookie": clearCookie(secure) });
    }
    if (path === "/api/auth/account") {
      if (method !== "DELETE") throw new HttpError(405, "method_not_allowed", "Use DELETE.");
      const u = currentUser(req);
      if (!u) throw new HttpError(401, "unauthorized", "Sign in first.");
      const body = (await readJson(req)) as { password?: unknown };
      if (!(await auth.confirmPassword(u, body?.password))) throw new HttpError(401, "invalid_credentials", "Password is incorrect.");
      auth.deleteAccount(u.id);
      log("info", "account deleted", { requestId, event: "account_deleted", status: 200 });
      return send(res, 200, { ok: true }, { "Set-Cookie": clearCookie(secure) });
    }
    if (path === "/api/auth/signup" || path === "/api/auth/login") {
      if (method !== "POST") throw new HttpError(405, "method_not_allowed", "Use POST.");
      const body = await readJson(req);
      const signup = path.endsWith("signup");
      const r = signup ? await auth.signup(body) : await auth.login(body, ip);
      if (!r.ok) throw new HttpError(r.status, failCode(r), r.message, { ...(r.fieldErrors ? { fieldErrors: r.fieldErrors } : {}), ...(r.retryAfterSeconds ? { retryAfterSeconds: r.retryAfterSeconds } : {}) });
      const token = signSession(authSecret, r.user.id, sessionTtl);
      log("info", signup ? "account created" : "login", { requestId, event: signup ? "signup" : "login", status: signup ? 201 : 200 });
      return send(res, signup ? 201 : 200, { user: r.value }, { "Set-Cookie": sessionCookie(token, sessionTtl, secure) });
    }
    throw new HttpError(404, "not_found", "Not found.");
  }

  async function analyze(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    const key = clientKey(req.headers, req.socket.remoteAddress, config.proxyHops);
    const account = currentUser(req);
    // Signed-in users get their own (higher) per-minute allowance, keyed by account instead of IP.
    const decision = account ? userLimiter.check(`user:${account.id}`) : limiter.check(key);
    if (!decision.allowed) {
      throw new HttpError(429, "rate_limited", decision.reason === "daily_cap" ? "The service has reached its daily analysis limit. Please try again later." : "Too many requests. Please wait before trying again.", { retryAfterSeconds: decision.retryAfterSeconds });
    }

    const ctype = (req.headers["content-type"] ?? "").split(";")[0]!.trim().toLowerCase();
    if (ctype !== "application/json") throw new HttpError(415, "unsupported_media_type", "Content-Type must be application/json.");

    const raw = await readBody(req);
    let json: unknown;
    try {
      json = JSON.parse(raw.toString("utf8"));
    } catch {
      throw new HttpError(400, "invalid_request", "Request body is not valid JSON.");
    }

    // Size limits first so oversized input yields 413 (not a generic 400).
    const o = (json && typeof json === "object" ? json : {}) as Record<string, any>;
    if (typeof o.text === "string" && o.text.length > config.maxTextChars) throw new HttpError(413, "payload_too_large", `Text is limited to ${config.maxTextChars} characters.`);
    if (typeof o.url === "string" && o.url.length > MAX_URL_CHARS) throw new HttpError(413, "payload_too_large", `URL is limited to ${MAX_URL_CHARS} characters.`);

    const parsed = AnalyzeRequestSchema.safeParse(json);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const i of parsed.error.issues) (fieldErrors[i.path.join(".") || "(root)"] ??= []).push(i.message);
      throw new HttpError(400, "invalid_request", "The request is invalid.", { fieldErrors });
    }
    const body = parsed.data;

    let input: InvestigateInput;
    if (body.inputType === "text") input = { type: "text", text: body.text };
    else if (body.inputType === "url") input = { type: "url", url: body.url };
    else {
      const chk = validateImage(body.image.dataBase64, body.image.mimeType, config.maxImageBytes);
      if (!chk.ok) {
        const code: ApiErrorCode = chk.status === 413 ? "payload_too_large" : chk.status === 415 ? "unsupported_media_type" : "invalid_request";
        throw new HttpError(chk.status, code, chk.reason);
      }
      input = { type: "image", bytes: chk.bytes, mimeType: chk.mimeType, ...(body.note ? { note: body.note } : {}) };
    }

    let report;
    try {
      report = await run(input, pipelineDeps);
    } catch (e) {
      if (e instanceof ImageAnalysisUnavailableError) throw new HttpError(503, "image_analysis_unavailable", "Screenshot analysis is not available on this server. Paste the text or the link instead.");
      throw e;
    }
    log("info", "analysis complete", {
      requestId, inputType: input.type, charCount: report.input.charCount,
      signalIds: [...new Set(report.signals.map((s) => s.id))], risk: report.classification.risk,
      mode: report.model.mode, usedModel: report.model.usedModel, latencyMs: report.timings.totalMs, status: 200,
    });
    send(res, 200, report);
  }

  return async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const requestId = "req_" + randomBytes(8).toString("hex");
    res.setHeader("X-Request-Id", requestId);
    applyCors(req, res);
    const method = req.method ?? "GET";
    const path = (req.url ?? "/").split("?")[0]!;
    try {
      if (method === "OPTIONS") {
        res.writeHead(204, SECURITY_HEADERS);
        return void res.end();
      }
      if (path === "/api/health") {
        if (method !== "GET") throw new HttpError(405, "method_not_allowed", "Use GET.");
        return send(res, 200, {
          status: "ok",
          version: VERSION,
          ai: config.aiConfigured ? "configured" : "missing_key",
          models: { primary: config.primaryModel, fallback: config.fallbackModel, vision: config.visionModel },
          screenshot: config.aiConfigured && !!config.visionModel ? "enabled" : "disabled",
          auth: "enabled",
        });
      }
      if (path.startsWith("/api/auth/")) {
        await authRoute(req, res, requestId, path, method);
        return;
      }
      if (path === "/api/analyze") {
        if (method !== "POST") throw new HttpError(405, "method_not_allowed", "Use POST.");
        await analyze(req, res, requestId);
        return;
      }
      throw new HttpError(404, "not_found", "Not found.");
    } catch (e) {
      if (e instanceof HttpError) {
        log(e.status >= 500 ? "error" : "info", "request rejected", { requestId, method, path, status: e.status, errorKind: e.code });
        return sendError(res, requestId, e);
      }
      log("error", "unhandled error", { requestId, method, path, status: 500, errorKind: (e as Error)?.name ?? "Error" });
      sendError(res, requestId, new HttpError(500, "internal_error", "Something went wrong on our side."));
    }
  };
}
