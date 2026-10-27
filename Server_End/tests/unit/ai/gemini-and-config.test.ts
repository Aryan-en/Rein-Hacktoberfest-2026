import { describe, expect, it } from "vitest";
import { GeminiProvider, type GeminiClient } from "../../../src/ai/providers/gemini";
import { createProvider } from "../../../src/ai/providers";
import { isPlaceholderKey, parseConfig } from "../../../src/config/env";
import { AiProviderError, type AiRequest } from "../../../src/types/ai";

const req: AiRequest = { model: "gemma-x", systemInstruction: "sys", userText: "hi", maxOutputTokens: 100, temperature: 0.1, jsonMode: true };
const sig = () => new AbortController().signal;
const client = (fn: (p: any) => any): GeminiClient => ({ models: { generateContent: async (p: any) => fn(p) } });
const ok = { text: '{"a":1}', modelVersion: "gemma-x-001", usageMetadata: { promptTokenCount: 3, candidatesTokenCount: 4 } };
const err = (status: number) => Object.assign(new Error("x"), { status });

describe("placeholder keys are never treated as real", () => {
  it.each(["", "  ", "dummy-digitalocean-key-not-real", "your-api-key-here", "<paste key>", "changeme", "REPLACE_ME", "xxxxxxxx"])("%j is a placeholder", (v) => expect(isPlaceholderKey(v)).toBe(true));
  it("real-looking keys pass", () => {
    expect(isPlaceholderKey("AIzaSyD-9tSrke72PouQMnMX-a7eZSW0jkFMBWY")).toBe(false);
    expect(isPlaceholderKey(undefined)).toBe(true);
  });
});

describe("provider selection", () => {
  it("auto: real Gemini key wins; Gemma 4 defaults apply", () => {
    const c = parseConfig({ GEMINI_API_KEY: "AIzaSyD-realish-key-0123456789abcdefghij", DO_GENAI_API_KEY: "dop_v1_real" });
    expect(c).toMatchObject({ provider: "gemini", aiConfigured: true, primaryModel: "gemma-4-31b-it", fallbackModel: "gemma-4-26b-a4b-it" });
  });
  it("a dummy DigitalOcean key does NOT enable AI (so the app never calls DO with a fake key)", () => {
    const c = parseConfig({ DO_GENAI_API_KEY: "dummy-digitalocean-key-not-real" });
    expect(c).toMatchObject({ provider: null, apiKey: null, aiConfigured: false });
    expect(createProvider(c)).toBeNull();
  });
  it("falls back to DigitalOcean only when it has a real key and Gemini does not", () => {
    const c = parseConfig({ GEMINI_API_KEY: "", DO_GENAI_API_KEY: "dop_v1_abcdef0123456789" });
    expect(c).toMatchObject({ provider: "digitalocean", primaryModel: "meta-llama/llama-3.3-70b-instruct" });
  });
  it("explicit AI_PROVIDER is honoured and requires its own key", () => {
    expect(parseConfig({ AI_PROVIDER: "digitalocean", GEMINI_API_KEY: "AIzaSyD-realish-key-0123456789abcdefghij" }).provider).toBeNull();
    expect(parseConfig({ AI_PROVIDER: "gemini", GEMINI_API_KEY: "AIzaSyD-realish-key-0123456789abcdefghij", DO_GENAI_API_KEY: "dop_v1_real" }).provider).toBe("gemini");
  });
  it("creates the matching adapter", () => {
    expect(createProvider(parseConfig({ GEMINI_API_KEY: "AIzaSyD-realish-key-0123456789abcdefghij" }))?.id).toBe("gemini-api");
    expect(createProvider(parseConfig({ DO_GENAI_API_KEY: "dop_v1_abcdef0123456789" }))?.id).toBe("digitalocean-genai");
  });
  it("never exposes the key in the config summary fields used by /api/health", () => {
    const c = parseConfig({ GEMINI_API_KEY: "AIzaSyD-realish-key-0123456789abcdefghij" });
    expect(JSON.stringify({ p: c.primaryModel, f: c.fallbackModel, v: c.visionModel, provider: c.provider })).not.toContain("AIza");
  });
});

describe("GeminiProvider", () => {
  it("sends system instruction, params, JSON mime and returns text/usage", async () => {
    let seen: any;
    const r = await new GeminiProvider(client((p) => ((seen = p), ok))).generate(req, { signal: sig() });
    expect(seen.model).toBe("gemma-x");
    expect(seen.config.systemInstruction).toBe("sys");
    expect(seen.config.responseMimeType).toBe("application/json");
    expect(seen.config.maxOutputTokens).toBe(100);
    expect(seen.contents[0].parts[0]).toEqual({ text: "hi" });
    expect(r).toMatchObject({ text: '{"a":1}', modelReported: "gemma-x-001", usage: { inputTokens: 3, outputTokens: 4 } });
  });
  it("sends images as inlineData base64", async () => {
    let seen: any;
    await new GeminiProvider(client((p) => ((seen = p), ok))).generate({ ...req, image: { mimeType: "image/png", data: new Uint8Array([1, 2, 3]) } }, { signal: sig() });
    expect(seen.contents[0].parts[1]).toEqual({ inlineData: { mimeType: "image/png", data: "AQID" } });
  });
  it("retries once without optional config when the model rejects it (400)", async () => {
    const calls: any[] = [];
    const c = client((p) => { calls.push(p); if (calls.length === 1) throw err(400); return ok; });
    await new GeminiProvider(c).generate(req, { signal: sig() });
    expect(calls).toHaveLength(2);
    expect(calls[1].config.responseMimeType).toBeUndefined();
    expect(calls[1].config.thinkingConfig).toBeUndefined();
    expect(calls[1].config.systemInstruction).toBe("sys");
  });
  it.each([[401, "auth"], [403, "auth"], [429, "rate_limited"], [404, "bad_request"], [500, "server"], [503, "server"]])("maps HTTP %s to %s", async (status, kind) => {
    await expect(new GeminiProvider(client(() => { throw err(status as number); })).generate(req, { signal: sig() })).rejects.toMatchObject({ kind });
  });
  it("maps abort to timeout and unknown to network", async () => {
    await expect(new GeminiProvider(client(() => { throw Object.assign(new Error("x"), { name: "AbortError" }); })).generate(req, { signal: sig() })).rejects.toMatchObject({ kind: "timeout" });
    await expect(new GeminiProvider(client(() => { throw new Error("ECONNRESET"); })).generate(req, { signal: sig() })).rejects.toMatchObject({ kind: "network" });
  });
  it("treats blocked or empty responses as safety_blocked", async () => {
    await expect(new GeminiProvider(client(() => ({ promptFeedback: { blockReason: "SAFETY" } }))).generate(req, { signal: sig() })).rejects.toBeInstanceOf(AiProviderError);
    await expect(new GeminiProvider(client(() => ({ text: "  " }))).generate(req, { signal: sig() })).rejects.toMatchObject({ kind: "safety_blocked" });
    await expect(new GeminiProvider(client(() => ({ text: "x", candidates: [{ finishReason: "SAFETY" }] }))).generate(req, { signal: sig() })).rejects.toMatchObject({ kind: "safety_blocked" });
  });
});
