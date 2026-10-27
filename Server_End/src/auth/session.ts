import { createHmac, timingSafeEqual } from "node:crypto";
import type { IncomingMessage } from "node:http";

export const SESSION_COOKIE = "tl_session";

interface Payload {
  uid: string;
  exp: number; // unix seconds
}

const b64url = (b: Buffer | string) => Buffer.from(b).toString("base64url");
const mac = (secret: string, data: string) => createHmac("sha256", secret).update(data).digest();

/** Stateless signed session token: base64url(payload).base64url(HMAC-SHA256). */
export function signSession(secret: string, uid: string, ttlSeconds: number, now = Date.now()): string {
  const body = b64url(JSON.stringify({ uid, exp: Math.floor(now / 1000) + ttlSeconds } satisfies Payload));
  return `${body}.${b64url(mac(secret, body))}`;
}

export function verifySession(secret: string, token: string | undefined, now = Date.now()): string | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = mac(secret, body);
  let given: Buffer;
  try {
    given = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    return typeof p.uid === "string" && typeof p.exp === "number" && p.exp > now / 1000 ? p.uid : null;
  } catch {
    return null;
  }
}

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of (header ?? "").split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (k && !(k in out)) out[k] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

export function sessionCookie(value: string, maxAgeSeconds: number, secure: boolean): string {
  return [`${SESSION_COOKIE}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAgeSeconds}`, ...(secure ? ["Secure"] : [])].join("; ");
}

export const clearCookie = (secure: boolean): string => sessionCookie("", 0, secure) + "; Expires=Thu, 01 Jan 1970 00:00:00 GMT";

export const isSecureRequest = (req: IncomingMessage): boolean =>
  req.headers["x-forwarded-proto"] === "https" || process.env.NODE_ENV === "production";
