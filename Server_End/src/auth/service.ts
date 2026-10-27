import { z } from "zod";
import { hashPassword, verifyPassword, dummyHash } from "./password";
import { EmailTakenError, type User, type UserStore } from "./store";

export const SignupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(254),
  password: z.string().min(8, "Use at least 8 characters.").max(128, "Use at most 128 characters."),
  name: z.string().trim().max(60, "Name is too long.").optional(),
});
export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(128),
});

const COMMON = new Set(["password", "password1", "12345678", "123456789", "1234567890", "qwertyui", "qwerty123", "iloveyou", "11111111", "00000000", "abcd1234", "trustlens"]);

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
export const toPublic = (u: User): PublicUser => ({ id: u.id, email: u.email, name: u.name, createdAt: u.createdAt });

export type AuthResult<T = PublicUser> = { ok: true; value: T; user: User } | { ok: false; status: 400 | 401 | 409 | 429; code: string; message: string; fieldErrors?: Record<string, string[]>; retryAfterSeconds?: number };

/** Failed-login throttle: 5 failures per key per 15 minutes. Keyed by client IP + email. */
export class FailureTracker {
  private m = new Map<string, { n: number; first: number }>();
  constructor(private max = 5, private windowMs = 15 * 60_000, private now: () => number = Date.now) {}
  blocked(key: string): number {
    const e = this.m.get(key);
    if (!e) return 0;
    if (this.now() - e.first > this.windowMs) { this.m.delete(key); return 0; }
    return e.n >= this.max ? Math.ceil((e.first + this.windowMs - this.now()) / 1000) : 0;
  }
  fail(key: string): void {
    const e = this.m.get(key);
    if (!e || this.now() - e.first > this.windowMs) this.m.set(key, { n: 1, first: this.now() });
    else e.n++;
    if (this.m.size > 5000) for (const [k, v] of this.m) if (this.now() - v.first > this.windowMs) this.m.delete(k);
  }
  clear(key: string): void { this.m.delete(key); }
}

export class AuthService {
  constructor(private store: UserStore, private failures = new FailureTracker()) {}

  async signup(input: unknown): Promise<AuthResult> {
    const p = SignupSchema.safeParse(input);
    if (!p.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const i of p.error.issues) (fieldErrors[String(i.path[0] ?? "form")] ??= []).push(i.message);
      return { ok: false, status: 400, code: "invalid_request", message: "Please fix the highlighted fields.", fieldErrors };
    }
    if (COMMON.has(p.data.password.toLowerCase())) {
      return { ok: false, status: 400, code: "invalid_request", message: "That password is too common.", fieldErrors: { password: ["That password is too common. Choose something less guessable."] } };
    }
    const passwordHash = await hashPassword(p.data.password);
    try {
      const user = this.store.create({ email: p.data.email, name: p.data.name?.trim() || p.data.email.split("@")[0]!, passwordHash });
      return { ok: true, value: toPublic(user), user };
    } catch (e) {
      if (e instanceof EmailTakenError) return { ok: false, status: 409, code: "email_taken", message: "An account with this email already exists. Try signing in." };
      throw e;
    }
  }

  async login(input: unknown, clientKey: string): Promise<AuthResult> {
    const p = LoginSchema.safeParse(input);
    if (!p.success) return { ok: false, status: 400, code: "invalid_request", message: "Enter your email and password." };
    const key = `${clientKey}|${p.data.email}`;
    const wait = this.failures.blocked(key);
    if (wait > 0) return { ok: false, status: 429, code: "too_many_attempts", message: "Too many failed attempts. Please wait before trying again.", retryAfterSeconds: wait };
    const user = this.store.findByEmail(p.data.email);
    // Always run one scrypt verification so unknown emails cost the same as wrong passwords.
    const ok = await verifyPassword(p.data.password, user?.passwordHash ?? (await dummyHash()));
    if (!user || !ok) {
      this.failures.fail(key);
      return { ok: false, status: 401, code: "invalid_credentials", message: "Invalid email or password." };
    }
    this.failures.clear(key);
    return { ok: true, value: toPublic(user), user };
  }

  async confirmPassword(user: User, password: unknown): Promise<boolean> {
    return typeof password === "string" && password.length > 0 && password.length <= 128 && (await verifyPassword(password, user.passwordHash));
  }

  user(id: string | null): User | null {
    return id ? this.store.findById(id) : null;
  }
  deleteAccount(id: string): boolean {
    return this.store.delete(id);
  }
}
