import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "../../src/auth/password";
import { AuthService, FailureTracker } from "../../src/auth/service";
import { clearCookie, parseCookies, sessionCookie, signSession, verifySession } from "../../src/auth/session";
import { EmailTakenError, FileUserStore } from "../../src/auth/store";

describe("password hashing", () => {
  it("verifies the right password and rejects wrong ones", async () => {
    const h = await hashPassword("correct horse battery");
    expect(h.startsWith("scrypt$")).toBe(true);
    expect(await verifyPassword("correct horse battery", h)).toBe(true);
    expect(await verifyPassword("correct horse batterY", h)).toBe(false);
  });
  it("salts: same password hashes differently", async () => {
    expect(await hashPassword("same-password-1")).not.toBe(await hashPassword("same-password-1"));
  });
  it("never stores the plaintext", async () => {
    expect(await hashPassword("super-secret-pw")).not.toContain("super-secret-pw");
  });
  it("malformed stored hashes fail closed", async () => {
    for (const bad of ["", "plain", "scrypt$1$2", "bcrypt$a$b$c$d$e"]) expect(await verifyPassword("x", bad)).toBe(false);
  });
}, 30000);

describe("sessions", () => {
  const S = "test-secret-which-is-long-enough-123456";
  it("round-trips a valid token", () => {
    expect(verifySession(S, signSession(S, "u1", 60))).toBe("u1");
  });
  it("rejects tampered payloads and wrong secrets", () => {
    const t = signSession(S, "u1", 60);
    const [body, sig] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ uid: "admin", exp: 9999999999 })).toString("base64url");
    expect(verifySession(S, `${forged}.${sig}`)).toBeNull();
    expect(verifySession("other-secret", t)).toBeNull();
    expect(verifySession(S, `${body}.`)).toBeNull();
    expect(verifySession(S, "garbage")).toBeNull();
    expect(verifySession(S, undefined)).toBeNull();
  });
  it("rejects expired tokens", () => {
    const t = signSession(S, "u1", 10, 1_000_000);
    expect(verifySession(S, t, 1_000_000 + 5_000)).toBe("u1");
    expect(verifySession(S, t, 1_000_000 + 11_000)).toBeNull();
  });
  it("cookie has HttpOnly, SameSite=Lax, Path and optional Secure", () => {
    const c = sessionCookie("v", 60, true);
    expect(c).toMatch(/HttpOnly/);
    expect(c).toMatch(/SameSite=Lax/);
    expect(c).toMatch(/Path=\//);
    expect(c).toMatch(/Secure/);
    expect(sessionCookie("v", 60, false)).not.toMatch(/Secure/);
    expect(clearCookie(false)).toMatch(/Max-Age=0/);
  });
  it("parses cookies defensively", () => {
    expect(parseCookies("a=1; tl_session=abc%20d; bad")).toEqual({ a: "1", tl_session: "abc d" });
    expect(parseCookies(undefined)).toEqual({});
  });
});

describe("FileUserStore", () => {
  it("enforces unique emails, deletes, and persists atomically with private permissions", () => {
    const dir = mkdtempSync(join(tmpdir(), "tl-"));
    const path = join(dir, "u", "users.json");
    try {
      const s = new FileUserStore(path);
      const u = s.create({ email: "a@example.com", name: "A", passwordHash: "h" });
      expect(() => s.create({ email: "a@example.com", name: "B", passwordHash: "h" })).toThrow(EmailTakenError);
      expect(statSync(path).mode & 0o777).toBe(0o600);
      const reloaded = new FileUserStore(path);
      expect(reloaded.findByEmail("a@example.com")?.id).toBe(u.id);
      expect(reloaded.delete(u.id)).toBe(true);
      expect(new FileUserStore(path).count()).toBe(0);
      expect(readFileSync(path, "utf8")).not.toContain("a@example.com");
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
  it("refuses to start on a corrupt file instead of silently wiping accounts", () => {
    const dir = mkdtempSync(join(tmpdir(), "tl-"));
    const path = join(dir, "users.json");
    try {
      require("node:fs").writeFileSync(path, "{not json");
      expect(() => new FileUserStore(path)).toThrow(/corrupt/i);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  });
});

describe("AuthService", () => {
  const mk = (now?: () => number) => new AuthService(new FileUserStore(null), new FailureTracker(5, 900_000, now));
  it("signs up with normalized email and default name; rejects duplicates case-insensitively", async () => {
    const a = mk();
    const r = await a.signup({ email: "  Jane.Doe@Example.COM ", password: "a-good-passphrase" });
    expect(r.ok && r.value.email).toBe("jane.doe@example.com");
    expect(r.ok && r.value.name).toBe("jane.doe");
    expect(r.ok && JSON.stringify(r.value)).not.toMatch(/passwordHash|scrypt/);
    const dup = await a.signup({ email: "JANE.DOE@example.com", password: "another-passphrase" });
    expect(dup).toMatchObject({ ok: false, status: 409, code: "email_taken" });
  });
  it("validates fields with per-field messages", async () => {
    const a = mk();
    expect(await a.signup({ email: "nope", password: "short" })).toMatchObject({ ok: false, status: 400, fieldErrors: { email: expect.any(Array), password: expect.any(Array) } });
    expect(await a.signup({ email: "x@example.com", password: "password1" })).toMatchObject({ ok: false, fieldErrors: { password: [expect.stringMatching(/common/i)] } });
    expect(await a.signup({ email: "x@example.com", password: "p".repeat(129) })).toMatchObject({ ok: false, status: 400 });
  });
  it("logs in with the right password only; same error for unknown email and wrong password", async () => {
    const a = mk();
    await a.signup({ email: "u@example.com", password: "a-good-passphrase" });
    expect((await a.login({ email: "U@example.com", password: "a-good-passphrase" }, "ip")).ok).toBe(true);
    const wrong = await a.login({ email: "u@example.com", password: "bad-passphrase-1" }, "ip");
    const unknown = await a.login({ email: "ghost@example.com", password: "bad-passphrase-1" }, "ip");
    expect(wrong).toMatchObject({ ok: false, status: 401, code: "invalid_credentials", message: "Invalid email or password." });
    expect(unknown).toEqual(wrong);
  });
  it("throttles after 5 failures, then recovers after the window, and success clears the counter", async () => {
    let t = 0;
    const a = mk(() => t);
    await a.signup({ email: "t@example.com", password: "a-good-passphrase" });
    for (let i = 0; i < 5; i++) await a.login({ email: "t@example.com", password: "wrong-wrong-1" }, "ip");
    const blocked = await a.login({ email: "t@example.com", password: "a-good-passphrase" }, "ip");
    expect(blocked).toMatchObject({ ok: false, status: 429, code: "too_many_attempts" });
    expect(blocked.ok === false && blocked.retryAfterSeconds).toBeGreaterThan(0);
    // other IPs are not blocked
    expect((await a.login({ email: "t@example.com", password: "a-good-passphrase" }, "other-ip")).ok).toBe(true);
    t += 901_000;
    expect((await a.login({ email: "t@example.com", password: "a-good-passphrase" }, "ip")).ok).toBe(true);
  });
  it("confirmPassword and deleteAccount", async () => {
    const a = mk();
    const r = await a.signup({ email: "d@example.com", password: "a-good-passphrase" });
    if (!r.ok) throw new Error("signup failed");
    expect(await a.confirmPassword(r.user, "a-good-passphrase")).toBe(true);
    expect(await a.confirmPassword(r.user, "nope-nope-nope")).toBe(false);
    expect(await a.confirmPassword(r.user, undefined)).toBe(false);
    expect(a.deleteAccount(r.user.id)).toBe(true);
    expect(a.user(r.user.id)).toBeNull();
  });
}, 60000);
