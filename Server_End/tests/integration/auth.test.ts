import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../../src/app";
import { FileUserStore } from "../../src/auth/store";
import { parseConfig } from "../../src/config/env";
import { configureLogger } from "../../src/lib/logger";
import { FakeProvider, KYC_PHISH, findingsJson } from "../helpers";

declare global {
  interface Response {
    json(): Promise<any>;
  }
}

const logs: string[] = [];
configureLogger("debug", (l) => logs.push(l));

let server: Server;
let base: string;
beforeAll(async () => {
  const config = parseConfig({
    DO_GENAI_API_KEY: "k", AUTH_SECRET: "integration-test-secret-0123456789", TRUSTLENS_RATE_LIMIT_PER_MIN: "2", TRUSTLENS_USER_RATE_LIMIT_PER_MIN: "50",
    TRUSTLENS_CORS_ORIGINS: "https://app.example", TRUSTLENS_PRIMARY_MODEL: "p", TRUSTLENS_FALLBACK_MODEL: "f",
  });
  server = createServer(createApp({ config, provider: new FakeProvider([findingsJson()]), userStore: new FileUserStore(null) }));
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((r) => server.close(() => r())));

const J = { "content-type": "application/json" };
const post = (path: string, body: unknown, headers: Record<string, string> = {}) => fetch(base + path, { method: "POST", headers: { ...J, ...headers }, body: JSON.stringify(body) });
const cookieOf = (res: Response) => (res.headers.get("set-cookie") ?? "").split(";")[0]!;

describe("accounts over HTTP", () => {
  it("signup sets an HttpOnly SameSite cookie and never returns the hash", async () => {
    const res = await post("/api/auth/signup", { email: "ann@example.com", password: "a-long-passphrase", name: "Ann" });
    expect(res.status).toBe(201);
    const sc = res.headers.get("set-cookie")!;
    expect(sc).toMatch(/^tl_session=/);
    expect(sc).toMatch(/HttpOnly/);
    expect(sc).toMatch(/SameSite=Lax/);
    const j = await res.json();
    expect(j.user).toMatchObject({ email: "ann@example.com", name: "Ann" });
    expect(JSON.stringify(j)).not.toMatch(/passwordHash|scrypt/);
  });

  it("/me reflects the session; anonymous gets user:null (200, no console error)", async () => {
    const s = await post("/api/auth/signup", { email: "bob@example.com", password: "a-long-passphrase" });
    const cookie = cookieOf(s);
    const me = await fetch(base + "/api/auth/me", { headers: { cookie } });
    expect((await me.json()).user.email).toBe("bob@example.com");
    const anon = await fetch(base + "/api/auth/me");
    expect(anon.status).toBe(200);
    expect((await anon.json()).user).toBeNull();
  });

  it("a forged or tampered cookie is ignored", async () => {
    const me = await fetch(base + "/api/auth/me", { headers: { cookie: "tl_session=eyJ1aWQiOiJ4IiwiZXhwIjo5OTk5OTk5OTk5fQ.AAAA" } });
    expect((await me.json()).user).toBeNull();
  });

  it("login: success, wrong password and unknown email look identical", async () => {
    await post("/api/auth/signup", { email: "cy@example.com", password: "a-long-passphrase" });
    expect((await post("/api/auth/login", { email: "cy@example.com", password: "a-long-passphrase" })).status).toBe(200);
    const wrong = await post("/api/auth/login", { email: "cy@example.com", password: "wrong-passphrase" });
    const unknown = await post("/api/auth/login", { email: "ghost@example.com", password: "wrong-passphrase" });
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    const [a, b] = [await wrong.json(), await unknown.json()];
    expect(a.error.code).toBe("invalid_credentials");
    expect({ ...a.error, requestId: "" }).toEqual({ ...b.error, requestId: "" });
  });

  it("duplicate email is 409; invalid input is 400 with fieldErrors", async () => {
    await post("/api/auth/signup", { email: "dup@example.com", password: "a-long-passphrase" });
    expect((await post("/api/auth/signup", { email: "DUP@example.com", password: "a-long-passphrase" })).status).toBe(409);
    const bad = await post("/api/auth/signup", { email: "nope", password: "x" });
    expect(bad.status).toBe(400);
    expect((await bad.json()).error.fieldErrors.email).toBeTruthy();
  });

  it("brute force is throttled with 429 + Retry-After", async () => {
    await post("/api/auth/signup", { email: "brute@example.com", password: "a-long-passphrase" });
    const codes: number[] = [];
    let last: Response | null = null;
    for (let i = 0; i < 7; i++) { last = await post("/api/auth/login", { email: "brute@example.com", password: "nope-nope-nope" }); codes.push(last.status); }
    expect(codes.slice(0, 5)).toEqual([401, 401, 401, 401, 401]);
    expect(codes[5]).toBe(429);
    expect(Number(last!.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("logout clears the cookie", async () => {
    const res = await post("/api/auth/logout", {});
    expect(res.status).toBe(200);
    expect(res.headers.get("set-cookie")).toMatch(/Max-Age=0/);
  });

  it("delete account requires the session and the correct password, then ends the session's validity", async () => {
    const s = await post("/api/auth/signup", { email: "del@example.com", password: "a-long-passphrase" });
    const cookie = cookieOf(s);
    expect((await fetch(base + "/api/auth/account", { method: "DELETE", headers: { ...J } , body: JSON.stringify({ password: "a-long-passphrase" }) })).status).toBe(401);
    expect((await fetch(base + "/api/auth/account", { method: "DELETE", headers: { ...J, cookie }, body: JSON.stringify({ password: "wrong-password" }) })).status).toBe(401);
    expect((await fetch(base + "/api/auth/account", { method: "DELETE", headers: { ...J, cookie }, body: JSON.stringify({ password: "a-long-passphrase" }) })).status).toBe(200);
    expect((await (await fetch(base + "/api/auth/me", { headers: { cookie } })).json()).user).toBeNull();
    expect((await post("/api/auth/login", { email: "del@example.com", password: "a-long-passphrase" })).status).toBe(401);
  });

  it("rejects non-JSON bodies and oversize auth bodies", async () => {
    expect((await fetch(base + "/api/auth/login", { method: "POST", headers: { "content-type": "text/plain" }, body: "x" })).status).toBe(415);
    const big = await fetch(base + "/api/auth/signup", { method: "POST", headers: J, body: JSON.stringify({ email: "a@example.com", password: "a".repeat(40_000) }) }).catch(() => null);
    if (big) expect(big.status).toBe(413);
  });

  it("never logs emails or passwords", async () => {
    logs.length = 0;
    await post("/api/auth/signup", { email: "secretlog@example.com", password: "very-secret-passphrase" });
    await post("/api/auth/login", { email: "secretlog@example.com", password: "very-secret-passphrase" });
    const joined = logs.join("\n");
    expect(joined).toContain("account created");
    expect(joined).not.toMatch(/secretlog|very-secret|example\.com/);
  });

  it("CORS allows credentials only for allow-listed origins", async () => {
    const ok = await fetch(base + "/api/auth/me", { headers: { Origin: "https://app.example" } });
    expect(ok.headers.get("access-control-allow-credentials")).toBe("true");
    expect(ok.headers.get("access-control-allow-origin")).toBe("https://app.example");
    const bad = await fetch(base + "/api/auth/me", { headers: { Origin: "https://evil.example" } });
    expect(bad.headers.get("access-control-allow-credentials")).toBeNull();
  });
});

describe("signed-in users get their own rate limit", () => {
  it("guests hit 429 at 2/min while a signed-in user keeps going", async () => {
    const guest: number[] = [];
    for (let i = 0; i < 4; i++) guest.push((await post("/api/analyze", { inputType: "text", text: KYC_PHISH })).status);
    expect(guest).toContain(429);
    const s = await post("/api/auth/signup", { email: "limit@example.com", password: "a-long-passphrase" });
    const cookie = cookieOf(s);
    const user: number[] = [];
    for (let i = 0; i < 6; i++) user.push((await post("/api/analyze", { inputType: "text", text: KYC_PHISH }, { cookie })).status);
    expect(user.every((c) => c === 200)).toBe(true);
  });
});
