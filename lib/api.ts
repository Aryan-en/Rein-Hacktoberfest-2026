import type { AnalyzeRequest, HealthInfo, InvestigationReport } from "./types";

// Default: same-origin "/api/*", proxied to BACKEND_URL by the rewrite in next.config.ts (no CORS needed).
// Set NEXT_PUBLIC_API_BASE_URL to call a backend directly instead (then enable CORS on it).
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(/\/+$/, "");

export class ApiClientError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number | null,
    public requestId?: string,
    public retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

export async function analyze(req: AnalyzeRequest, signal: AbortSignal): Promise<InvestigationReport> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/analyze`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(req),
      signal,
      credentials: "include",
    });
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    throw new ApiClientError("network", "Could not reach the TrustLens server. Check that the backend is running.", null);
  }
  if (res.ok) return (await res.json()) as InvestigationReport;
  let body: { error?: { code?: string; message?: string; requestId?: string; retryAfterSeconds?: number } } = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON error */
  }
  const e = body.error ?? {};
  throw new ApiClientError(e.code ?? "internal_error", e.message ?? "Something went wrong on our side.", res.status, e.requestId, e.retryAfterSeconds);
}

export async function fetchHealth(signal?: AbortSignal): Promise<HealthInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal, cache: "no-store", credentials: "include" });
    return res.ok ? ((await res.json()) as HealthInfo) : null;
  } catch {
    return null;
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).replace(/^data:[^,]*,/, ""));
    r.onerror = () => reject(new Error("Could not read the file."));
    r.readAsDataURL(file);
  });
}

// ---------- Accounts ----------
import type { AuthUser } from "./types";

export interface AuthFieldErrors {
  [field: string]: string[];
}

export class AuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number | null,
    public fieldErrors?: AuthFieldErrors,
    public retryAfterSeconds?: number,
  ) {
    super(message);
  }
}

async function authFetch(path: string, init: RequestInit & { json?: unknown } = {}): Promise<Response> {
  const { json, ...rest } = init;
  try {
    return await fetch(`${API_BASE}${path}`, {
      ...rest,
      credentials: "include",
      headers: { ...(json !== undefined ? { "content-type": "application/json" } : {}), ...(rest.headers ?? {}) },
      ...(json !== undefined ? { body: JSON.stringify(json) } : {}),
    });
  } catch {
    throw new AuthError("network", "Could not reach the TrustLens server. Check that the backend is running.", null);
  }
}

async function authFail(res: Response): Promise<never> {
  let e: { code?: string; message?: string; fieldErrors?: AuthFieldErrors; retryAfterSeconds?: number } = {};
  try {
    e = (await res.json()).error ?? {};
  } catch {
    /* non-JSON */
  }
  throw new AuthError(e.code ?? "internal_error", e.message ?? "Something went wrong on our side.", res.status, e.fieldErrors, e.retryAfterSeconds);
}

export async function fetchMe(): Promise<AuthUser | null> {
  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, { credentials: "include", cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { user: AuthUser | null }).user;
  } catch {
    return null;
  }
}

export async function signup(input: { email: string; password: string; name?: string }): Promise<AuthUser> {
  const res = await authFetch("/api/auth/signup", { method: "POST", json: input });
  if (!res.ok) return authFail(res);
  return ((await res.json()) as { user: AuthUser }).user;
}

export async function login(input: { email: string; password: string }): Promise<AuthUser> {
  const res = await authFetch("/api/auth/login", { method: "POST", json: input });
  if (!res.ok) return authFail(res);
  return ((await res.json()) as { user: AuthUser }).user;
}

export async function logout(): Promise<void> {
  await authFetch("/api/auth/logout", { method: "POST", json: {} }).catch(() => undefined);
}

export async function deleteAccount(password: string): Promise<void> {
  const res = await authFetch("/api/auth/account", { method: "DELETE", json: { password } });
  if (!res.ok) return authFail(res);
}
