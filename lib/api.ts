import type { AnalyzeRequest, HealthInfo, InvestigationReport } from "./types";

export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080").replace(/\/+$/, "");

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
    const res = await fetch(`${API_BASE}/api/health`, { signal, cache: "no-store" });
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
