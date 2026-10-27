import { randomBytes } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { ImageAnalysisUnavailableError, investigate, type InvestigateInput, type PipelineDeps } from "./analysis/pipeline";
import type { AppConfig } from "./config/env";
import { log } from "./lib/logger";
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
  const run = deps.investigateFn ?? investigate;
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
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Expose-Headers", "X-Request-Id, Retry-After");
      res.setHeader("Access-Control-Max-Age", "600");
    }
  }

  function readBody(req: IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const declared = Number(req.headers["content-length"]);
      if (Number.isFinite(declared) && declared > maxBody) return reject(new HttpError(413, "payload_too_large", "Request body is too large."));
      const chunks: Buffer[] = [];
      let size = 0;
      req.on("data", (c: Buffer) => {
        size += c.length;
        if (size > maxBody) {
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

  async function analyze(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    const key = clientKey(req.headers, req.socket.remoteAddress, config.proxyHops);
    const decision = limiter.check(key);
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
        });
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
