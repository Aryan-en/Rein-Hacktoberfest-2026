import { describe, expect, it } from "vitest";
import { decodedLength, sniffMime, validateImage } from "../../../src/security/image-validate";
import { clientKey, RateLimiter } from "../../../src/security/rate-limit";

describe("RateLimiter", () => {
  it("allows burst up to capacity then blocks with retry-after", () => {
    let t = Date.parse("2026-10-27T10:00:00Z");
    const rl = new RateLimiter({ perMinute: 3, dailyCap: 100, now: () => t });
    expect([1, 2, 3].every(() => rl.check("a").allowed)).toBe(true);
    const d = rl.check("a");
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("rate");
    expect(d.retryAfterSeconds).toBeGreaterThan(0);
    t += 21_000; // refill 1 token (3/min)
    expect(rl.check("a").allowed).toBe(true);
  });
  it("tracks keys independently", () => {
    const rl = new RateLimiter({ perMinute: 1, dailyCap: 100, now: () => 0 });
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("b").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
  });
  it("enforces the daily cap and resets next UTC day", () => {
    let t = Date.parse("2026-10-27T10:00:00Z");
    const rl = new RateLimiter({ perMinute: 100, dailyCap: 2, now: () => t });
    rl.check("a"); rl.check("b");
    const d = rl.check("c");
    expect(d).toMatchObject({ allowed: false, reason: "daily_cap" });
    t = Date.parse("2026-10-28T00:00:01Z");
    expect(rl.check("c").allowed).toBe(true);
  });
  it("bounds memory", () => {
    let t = 0;
    const rl = new RateLimiter({ perMinute: 5, dailyCap: 1e9, maxKeys: 50, now: () => t });
    for (let i = 0; i < 500; i++) { t += 10; rl.check("k" + i); }
    expect((rl as any).buckets.size).toBeLessThanOrEqual(60);
  });
});

describe("clientKey", () => {
  it("uses the Nth entry from the right of X-Forwarded-For", () => {
    expect(clientKey({ "x-forwarded-for": "6.6.6.6, 1.2.3.4" }, "9.9.9.9", 1)).toBe("1.2.3.4");
    expect(clientKey({ "x-forwarded-for": "6.6.6.6, 1.2.3.4, 10.0.0.1" }, "9.9.9.9", 2)).toBe("1.2.3.4");
  });
  it("ignores the header when hops=0", () => {
    expect(clientKey({ "x-forwarded-for": "6.6.6.6" }, "9.9.9.9", 0)).toBe("9.9.9.9");
  });
  it("falls back to the socket address", () => {
    expect(clientKey({}, "9.9.9.9", 1)).toBe("9.9.9.9");
  });
});

const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const JPG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const WEBP = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBP")]);

describe("validateImage", () => {
  it("accepts matching PNG/JPEG/WebP", () => {
    expect(validateImage(PNG.toString("base64"), "image/png", 1000).ok).toBe(true);
    expect(validateImage(JPG.toString("base64"), "image/jpeg", 1000).ok).toBe(true);
    expect(validateImage(WEBP.toString("base64"), "image/webp", 1000).ok).toBe(true);
  });
  it("rejects declared/actual mismatch (415)", () => {
    expect(validateImage(PNG.toString("base64"), "image/jpeg", 1000)).toMatchObject({ ok: false, status: 415 });
  });
  it("rejects SVG / HTML / GIF disguised as image (415)", () => {
    for (const body of ["<svg xmlns='http://www.w3.org/2000/svg'/>", "<html></html>", "GIF89a....."]) {
      expect(validateImage(Buffer.from(body).toString("base64"), "image/png", 1000)).toMatchObject({ ok: false, status: 415 });
    }
  });
  it("rejects oversize (413) before decoding", () => {
    expect(validateImage(Buffer.alloc(2000, 1).toString("base64"), "image/png", 1000)).toMatchObject({ ok: false, status: 413 });
  });
  it("rejects invalid base64 (400)", () => {
    expect(validateImage("not base64!!", "image/png", 1000)).toMatchObject({ ok: false, status: 400 });
  });
  it("accepts data URL prefix", () => {
    expect(validateImage("data:image/png;base64," + PNG.toString("base64"), "image/png", 1000).ok).toBe(true);
  });
  it("sniff + decodedLength helpers", () => {
    expect(sniffMime(PNG)).toBe("image/png");
    expect(decodedLength(PNG.toString("base64"))).toBe(PNG.length);
  });
});
