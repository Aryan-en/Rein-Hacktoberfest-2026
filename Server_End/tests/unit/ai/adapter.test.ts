import { describe, expect, it } from "vitest";
import { DigitalOceanProvider, type ChatClient } from "../../../src/ai/providers/digitalocean";
import { AiProviderError, type AiRequest } from "../../../src/types/ai";

const req: AiRequest = { model: "m", systemInstruction: "sys", userText: "hi", maxOutputTokens: 100, temperature: 0.1, jsonMode: true };
const sig = () => new AbortController().signal;
const client = (create: (p: any) => any): ChatClient => ({ chat: { completions: { create: async (p: any) => create(p) } } });
const ok = { model: "m-reported", choices: [{ message: { content: "{}" }, finish_reason: "stop" }], usage: { prompt_tokens: 3, completion_tokens: 4 } };
const err = (status: number, message = "x") => Object.assign(new Error(message), { status });

describe("DigitalOceanProvider", () => {
  it("sends system + user messages, JSON mode, and returns text/usage", async () => {
    let seen: any;
    const r = await new DigitalOceanProvider(client((p) => ((seen = p), ok))).generate(req, { signal: sig() });
    expect(seen.messages[0]).toEqual({ role: "system", content: "sys" });
    expect(seen.response_format).toEqual({ type: "json_object" });
    expect(seen.max_tokens).toBe(100);
    expect(r).toMatchObject({ text: "{}", modelReported: "m-reported", usage: { inputTokens: 3, outputTokens: 4 } });
  });
  it("sends images as data-URI image_url parts", async () => {
    let seen: any;
    await new DigitalOceanProvider(client((p) => ((seen = p), ok))).generate({ ...req, image: { mimeType: "image/png", data: new Uint8Array([1, 2, 3]) } }, { signal: sig() });
    const parts = seen.messages[1].content;
    expect(parts[1].image_url.url).toBe("data:image/png;base64,AQID");
  });
  it("retries once without response_format when the endpoint rejects it", async () => {
    const calls: any[] = [];
    const c = client((p) => { calls.push(p); if (p.response_format) throw err(400, "response_format not supported"); return ok; });
    await new DigitalOceanProvider(c).generate(req, { signal: sig() });
    expect(calls).toHaveLength(2);
    expect(calls[1].response_format).toBeUndefined();
  });
  it.each([
    [401, "auth"], [403, "auth"], [429, "rate_limited"], [400, "bad_request"], [404, "bad_request"], [500, "server"], [503, "server"],
  ])("maps HTTP %s to %s", async (status, kind) => {
    await expect(new DigitalOceanProvider(client(() => { throw err(status as number); })).generate(req, { signal: sig() })).rejects.toMatchObject({ kind });
  });
  it("maps abort to timeout and unknown errors to network", async () => {
    await expect(new DigitalOceanProvider(client(() => { throw Object.assign(new Error("a"), { name: "AbortError" }); })).generate(req, { signal: sig() })).rejects.toMatchObject({ kind: "timeout" });
    await expect(new DigitalOceanProvider(client(() => { throw new Error("ECONNRESET"); })).generate(req, { signal: sig() })).rejects.toMatchObject({ kind: "network" });
  });
  it("treats empty or filtered responses as safety_blocked", async () => {
    await expect(new DigitalOceanProvider(client(() => ({ choices: [{ message: { content: null } }] }))).generate(req, { signal: sig() })).rejects.toBeInstanceOf(AiProviderError);
    await expect(new DigitalOceanProvider(client(() => ({ choices: [{ message: { content: "x" }, finish_reason: "content_filter" }] }))).generate(req, { signal: sig() })).rejects.toMatchObject({ kind: "safety_blocked" });
  });
  it("does not leak prompt content in error messages", async () => {
    const e = await new DigitalOceanProvider(client(() => { throw err(500, "boom: " + req.userText); })).generate(req, { signal: sig() }).catch((x) => x);
    expect(String(e.message)).not.toContain("hi");
  });
});
