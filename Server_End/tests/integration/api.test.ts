import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createApp } from "../../src/app";
import { parseConfig } from "../../src/config/env";
import { configureLogger } from "../../src/lib/logger";
import { RateLimiter } from "../../src/security/rate-limit";
import { AiProviderError } from "../../src/types/ai";
import { FakeProvider, KYC_PHISH, findingsJson } from "../helpers";

declare global {
  interface Response {
    json(): Promise<any>;
  }
}

const PNG_B64 = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]).toString("base64");
const logs: string[] = [];
configureLogger("debug", (l) => logs.push(l));

async function boot(env: Record<string, string> = {}, provider: FakeProvider | null = new FakeProvider([findingsJson()]), limiter?: RateLimiter) {
  const config = parseConfig({ DO_GENAI_API_KEY: provider ? "test-key" : "", TRUSTLENS_PRIMARY_MODEL: "primary", TRUSTLENS_FALLBACK_MODEL: "fallback", TRUSTLENS_MODEL_TIMEOUT_MS: "1000", ...env });
  const server: Server = createServer(createApp({ config, provider, ...(limiter ? { limiter } : {}) }));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  return { base, server, provider, close: () => new Promise<void>((r) => server.close(() => r())) };
}
const post = (base: string, body: unknown, headers: Record<string, string> = { "content-type": "application/json" }) =>
  fetch(base + "/api/analyze", { method: "POST", headers, body: typeof body === "string" ? body : JSON.stringify(body) });

let app: Awaited<ReturnType<typeof boot>>;
beforeAll(async () => { app = await boot({ TRUSTLENS_RATE_LIMIT_PER_MIN: "1000", TRUSTLENS_DAILY_CAP: "100000" }, new FakeProvider([findingsJson()])); });
afterAll(async () => { await app.close(); });

describe("POST /api/analyze", () => {
  it("200: text input returns a full report with model disclosure and request id", async () => {
    const res = await post(app.base, { inputType: "text", text: KYC_PHISH });
    expect(res.status).toBe(200);
    expect(res.headers.get("x-request-id")).toMatch(/^req_[0-9a-f]{16}$/);
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("cache-control")).toBe("no-store");
    const r = await res.json();
    expect(r.classification.risk).toBe("high");
    expect(r.model.usedModel).toBe("primary");
    expect(r.evidence.length).toBeGreaterThan(0);
  });
  it("200: url input", async () => {
    const res = await post(app.base, { inputType: "url", url: "http://203.0.113.9/login" });
    expect(res.status).toBe(200);
    const r = await res.json();
    expect(r.urls[0].parsed.isIp).toBe(true);
    expect(r.signals.map((s: any) => s.id)).toContain("url_ip_host");
  });
  it("400: invalid JSON", async () => {
    const res = await post(app.base, "{nope");
    expect(res.status).toBe(400);
    expect((await res.json()).error.code).toBe("invalid_request");
  });
  it("400: schema failure with fieldErrors", async () => {
    const res = await post(app.base, { inputType: "text", text: "   " });
    expect(res.status).toBe(400);
    const j = await res.json();
    expect(j.error.fieldErrors.text).toBeTruthy();
    expect(j.error.requestId).toMatch(/^req_/);
  });
  it("400: unknown inputType", async () => {
    expect((await post(app.base, { inputType: "video" })).status).toBe(400);
  });
  it("413: text over the limit", async () => {
    const res = await post(app.base, { inputType: "text", text: "a".repeat(8001) });
    expect(res.status).toBe(413);
    expect((await res.json()).error.code).toBe("payload_too_large");
  });
  it("413: body over the byte cap", async () => {
    const res = await post(app.base, { inputType: "text", text: "a".repeat(6_000_000) }).catch(() => null);
    // Server may close the connection once the cap is hit; either a 413 or a reset is acceptable, never 200.
    if (res) expect(res.status).toBe(413);
  });
  it("415: wrong content type", async () => {
    const res = await post(app.base, "inputType=text", { "content-type": "text/plain" });
    expect(res.status).toBe(415);
  });
  it("415: image whose bytes do not match its declared type", async () => {
    const res = await post(app.base, { inputType: "image", image: { mimeType: "image/jpeg", dataBase64: PNG_B64 } });
    expect(res.status).toBe(415);
  });
  it("415: SVG smuggled as PNG", async () => {
    const res = await post(app.base, { inputType: "image", image: { mimeType: "image/png", dataBase64: Buffer.from("<svg onload=alert(1)>").toString("base64") } });
    expect(res.status).toBe(415);
  });
  it("503: screenshot mode when no vision model is configured", async () => {
    const res = await post(app.base, { inputType: "image", image: { mimeType: "image/png", dataBase64: PNG_B64 } });
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("image_analysis_unavailable");
  });
  it("405 and 404", async () => {
    expect((await fetch(app.base + "/api/analyze")).status).toBe(405);
    expect((await fetch(app.base + "/nope")).status).toBe(404);
  });
  it("never includes stack traces or the API key in error bodies", async () => {
    const body = await (await post(app.base, "{bad")).text();
    expect(body).not.toMatch(/at .*\(.*:\d+:\d+\)|test-key|node_modules/);
  });
  it("does not log submitted content", async () => {
    logs.length = 0;
    await post(app.base, { inputType: "text", text: "TOPSECRET-CANARY-7731 share your OTP now http://canary-7731.example/x" });
    const joined = logs.join("\n");
    expect(joined).toContain("analysis complete");
    expect(joined).not.toMatch(/CANARY|canary-7731|OTP now/i);
  });
});

describe("degradation", () => {
  it("200 deterministic_only when all models fail", async () => {
    const a = await boot({}, new FakeProvider([new AiProviderError("timeout", "t"), new AiProviderError("rate_limited", "q")]));
    try {
      const res = await post(a.base, { inputType: "text", text: KYC_PHISH });
      expect(res.status).toBe(200);
      const r = await res.json();
      expect(r.model).toMatchObject({ mode: "deterministic_only", usedModel: null });
      expect(r.explanation).toBeNull();
      expect(r.classification.risk).toBe("high");
    } finally { await a.close(); }
  });
  it("200 deterministic_only with no API key configured", async () => {
    const a = await boot({}, null);
    try {
      const r = await (await post(a.base, { inputType: "text", text: KYC_PHISH })).json();
      expect(r.model.mode).toBe("deterministic_only");
      const h = await (await fetch(a.base + "/api/health")).json();
      expect(h.ai).toBe("missing_key");
    } finally { await a.close(); }
  });
  it("reports fallback usage honestly", async () => {
    const a = await boot({}, new FakeProvider([new AiProviderError("timeout", "t"), findingsJson()]));
    try {
      const r = await (await post(a.base, { inputType: "text", text: KYC_PHISH })).json();
      expect(r.model).toMatchObject({ requestedModel: "primary", usedModel: "fallback", fellBack: true });
    } finally { await a.close(); }
  });
});

describe("screenshot mode (vision model configured)", () => {
  it("200 with OCR text analysed", async () => {
    const ocr = "Your account is blocked, share OTP at http://192.0.2.9/x within 2 hours";
    const a = await boot({ TRUSTLENS_VISION_MODEL: "vision" }, new FakeProvider([findingsJson({ extractedText: ocr })]));
    try {
      const res = await post(a.base, { inputType: "image", image: { mimeType: "image/png", dataBase64: PNG_B64 } });
      expect(res.status).toBe(200);
      const r = await res.json();
      expect(r.input.textSource).toBe("ocr");
      expect(r.model.usedModel).toBe("vision");
    } finally { await a.close(); }
  });
  it("413 for oversize image", async () => {
    const a = await boot({ TRUSTLENS_VISION_MODEL: "vision", TRUSTLENS_MAX_IMAGE_BYTES: "1000" });
    try {
      const big = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(5000)]).toString("base64");
      expect((await post(a.base, { inputType: "image", image: { mimeType: "image/png", dataBase64: big } })).status).toBe(413);
    } finally { await a.close(); }
  });
});

describe("rate limiting", () => {
  it("429 with Retry-After once the limit is hit", async () => {
    const a = await boot({ TRUSTLENS_RATE_LIMIT_PER_MIN: "2" }, new FakeProvider([findingsJson()]));
    try {
      const codes: number[] = [];
      let last: Response | null = null;
      for (let i = 0; i < 4; i++) { last = await post(a.base, { inputType: "text", text: KYC_PHISH }); codes.push(last.status); }
      expect(codes).toEqual([200, 200, 429, 429]);
      expect(Number(last!.headers.get("retry-after"))).toBeGreaterThan(0);
      const j = await last!.json();
      expect(j.error).toMatchObject({ code: "rate_limited" });
      expect(j.error.retryAfterSeconds).toBeGreaterThan(0);
    } finally { await a.close(); }
  });
  it("the rate limit applies before body parsing (cheap rejection)", async () => {
    const a = await boot({ TRUSTLENS_RATE_LIMIT_PER_MIN: "1" });
    try {
      await post(a.base, { inputType: "text", text: KYC_PHISH });
      expect((await post(a.base, "garbage")).status).toBe(429);
    } finally { await a.close(); }
  });
});

describe("health, CORS and headers", () => {
  it("GET /api/health does not call the model", async () => {
    const p = new FakeProvider([findingsJson()]);
    const a = await boot({}, p);
    try {
      const h = await (await fetch(a.base + "/api/health")).json();
      expect(h).toMatchObject({ status: "ok", ai: "configured" });
      expect(h.models.primary).toBe("primary");
      expect(JSON.stringify(h)).not.toContain("test-key");
      expect(p.calls).toHaveLength(0);
    } finally { await a.close(); }
  });
  it("CORS: allowed origin echoed, others not; preflight 204", async () => {
    const a = await boot({ TRUSTLENS_CORS_ORIGINS: "https://app.example" });
    try {
      const ok = await fetch(a.base + "/api/health", { headers: { Origin: "https://app.example" } });
      expect(ok.headers.get("access-control-allow-origin")).toBe("https://app.example");
      const bad = await fetch(a.base + "/api/health", { headers: { Origin: "https://evil.example" } });
      expect(bad.headers.get("access-control-allow-origin")).toBeNull();
      const pre = await fetch(a.base + "/api/analyze", { method: "OPTIONS", headers: { Origin: "https://app.example", "Access-Control-Request-Method": "POST" } });
      expect(pre.status).toBe(204);
    } finally { await a.close(); }
  });
  it("makes no outbound HTTP request during URL analysis (only the injected provider is used)", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    const a = await boot({}, new FakeProvider([findingsJson()]));
    try {
      spy.mockClear();
      const real = (spy as any).getMockImplementation?.();
      void real;
      const before = spy.mock.calls.length;
      // The test client itself uses fetch; assert no call targets the submitted host.
      await post(a.base, { inputType: "url", url: "http://evil-target.example/steal" });
      const targets = spy.mock.calls.slice(before).map((c) => String(c[0]));
      expect(targets.some((t) => t.includes("evil-target.example"))).toBe(false);
    } finally { spy.mockRestore(); await a.close(); }
  });
});
