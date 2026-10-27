import { describe, expect, it } from "vitest";
import { runInference } from "../../../src/ai/orchestrator";
import { AiProviderError } from "../../../src/types/ai";
import { FakeProvider, findingsJson } from "../../helpers";

const input = { models: ["m-primary", "m-fallback"], systemInstruction: "sys", userText: "user" };
const deps = (p: FakeProvider | null, extra = {}) => ({ provider: p, timeoutMs: 200, jsonMode: true, sleep: async () => {}, ...extra });

describe("runInference", () => {
  it("returns findings from the primary model", async () => {
    const p = new FakeProvider([findingsJson()]);
    const r = await runInference(input, deps(p));
    expect(r.findings?.aiRisk).toBe("high");
    expect(r.disclosure).toMatchObject({ mode: "ai_assisted", usedModel: "m-primary", requestedModel: "m-primary", fellBack: false });
    expect(p.calls).toHaveLength(1);
    expect(p.calls[0]!.model).toBe("m-primary");
  });
  it("falls back to the second DigitalOcean open-weight model on timeout", async () => {
    const p = new FakeProvider([new AiProviderError("timeout", "t"), findingsJson()]);
    const r = await runInference(input, deps(p));
    expect(r.disclosure.usedModel).toBe("m-fallback");
    expect(r.disclosure.fellBack).toBe(true);
    expect(r.disclosure.attempts.map((a) => a.outcome)).toEqual(["timeout", "ok"]);
  });
  it("enforces its own timeout when the provider hangs", async () => {
    const p = new FakeProvider([() => new Promise<string>(() => {}), findingsJson()]);
    const r = await runInference(input, deps(p, { timeoutMs: 30 }));
    expect(r.disclosure.attempts[0]!.outcome).toBe("timeout");
    expect(r.disclosure.usedModel).toBe("m-fallback");
  });
  it("429 does not retry the same model", async () => {
    const p = new FakeProvider([new AiProviderError("rate_limited", "q"), findingsJson()]);
    await runInference(input, deps(p));
    expect(p.calls.map((c) => c.model)).toEqual(["m-primary", "m-fallback"]);
  });
  it("5xx retries the same model once", async () => {
    const p = new FakeProvider([new AiProviderError("server", "s"), findingsJson()]);
    const r = await runInference(input, deps(p));
    expect(p.calls.map((c) => c.model)).toEqual(["m-primary", "m-primary"]);
    expect(r.disclosure.fellBack).toBe(false);
  });
  it("repairs invalid JSON once on the same model", async () => {
    const p = new FakeProvider(["not json at all", findingsJson()]);
    const r = await runInference(input, deps(p));
    expect(r.findings).not.toBeNull();
    expect(p.calls[1]!.userText).toContain("could not be used");
    expect(r.disclosure.attempts.map((a) => a.outcome)).toEqual(["invalid_output", "ok"]);
  });
  it("moves to fallback when repair also fails", async () => {
    const p = new FakeProvider(["junk", "still junk", findingsJson()]);
    const r = await runInference(input, deps(p));
    expect(r.disclosure.usedModel).toBe("m-fallback");
  });
  it("degrades to deterministic_only when every model fails, with honest disclosure", async () => {
    const p = new FakeProvider([new AiProviderError("timeout", "t"), new AiProviderError("rate_limited", "r")]);
    const r = await runInference(input, deps(p));
    expect(r.findings).toBeNull();
    expect(r.disclosure).toMatchObject({ mode: "deterministic_only", usedModel: null, fellBack: false });
    expect(r.disclosure.degradedReason).toBeTruthy();
    expect(r.disclosure.attempts).toHaveLength(2);
  });
  it("auth failure stops the chain immediately", async () => {
    const p = new FakeProvider([new AiProviderError("auth", "bad key")]);
    const r = await runInference(input, deps(p));
    expect(p.calls).toHaveLength(1);
    expect(r.disclosure.degradedReason).toMatch(/credentials/i);
  });
  it("no provider (missing key) degrades without any call", async () => {
    const r = await runInference(input, deps(null));
    expect(r.disclosure.mode).toBe("deterministic_only");
    expect(r.disclosure.degradedReason).toMatch(/not configured/i);
    expect(r.modelMs).toBeNull();
  });
  it("never calls a model that was not configured", async () => {
    const p = new FakeProvider([new AiProviderError("timeout", "t"), new AiProviderError("timeout", "t"), new AiProviderError("timeout", "t")]);
    await runInference(input, deps(p));
    expect(new Set(p.calls.map((c) => c.model))).toEqual(new Set(["m-primary", "m-fallback"]));
  });
  it("respects the total budget", async () => {
    let t = 0;
    const p = new FakeProvider([new AiProviderError("timeout", "t"), findingsJson()]);
    const r = await runInference(input, { ...deps(p, { budgetMs: 100 }), now: () => (t += 150) });
    expect(r.findings).toBeNull();
  });
  it("passes image and params through to the provider", async () => {
    const p = new FakeProvider([findingsJson()]);
    await runInference({ ...input, image: { mimeType: "image/png", data: new Uint8Array([1]) } }, deps(p));
    expect(p.calls[0]!.image?.mimeType).toBe("image/png");
    expect(p.calls[0]!.temperature).toBeLessThanOrEqual(0.2);
  });
});
