"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { analyze, ApiClientError, fetchHealth } from "@/lib/api";
import type { AnalyzeRequest, HealthInfo, InvestigationReport, Lang } from "@/lib/types";

export type Status = "idle" | "submitting" | "success" | "error";

export interface HistoryItem {
  id: string;
  at: string;
  report: InvestigationReport;
}

export interface UiError {
  code: string;
  message: string;
  requestId?: string;
  retryAfterSeconds?: number;
}

interface Ctx {
  lang: Lang;
  setLang(l: Lang): void;
  status: Status;
  report: InvestigationReport | null;
  error: UiError | null;
  elapsedMs: number;
  cooldown: number;
  history: HistoryItem[];
  health: HealthInfo | null;
  healthChecked: boolean;
  submit(req: AnalyzeRequest): Promise<void>;
  reset(): void;
  open(id: string): void;
  clearHistory(): void;
}

const InvestigationContext = createContext<Ctx | null>(null);
const LANG_KEY = "trustlens.lang";
const HISTORY_MAX = 20;

export function InvestigationProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [status, setStatus] = useState<Status>("idle");
  const [report, setReport] = useState<InvestigationReport | null>(null);
  const [error, setError] = useState<UiError | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [healthChecked, setHealthChecked] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Language preference is the only thing persisted (no investigation content is ever stored).
  useEffect(() => {
    // Post-mount read of an external store (localStorage); doing it in render would break hydration.
    const saved = localStorage.getItem(LANG_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "hi" || saved === "en") setLangState(saved);
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    void fetchHealth(ctrl.signal).then((h) => {
      if (ctrl.signal.aborted) return;
      setHealth(h);
      setHealthChecked(true);
    });
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    if (status !== "submitting") return;
    const t0 = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - t0), 250);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const submit = useCallback(async (req: AnalyzeRequest) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timeout = setTimeout(() => ctrl.abort(), 90_000);
    setStatus("submitting");
    setElapsedMs(0);
    setError(null);
    try {
      const r = await analyze(req, ctrl.signal);
      setReport(r);
      setStatus("success");
      setHistory((h) => [{ id: r.reportId, at: r.generatedAt, report: r }, ...h].slice(0, HISTORY_MAX));
    } catch (e) {
      if ((e as Error).name === "AbortError") {
        if (abortRef.current === ctrl) {
          setError({ code: "timeout", message: "The analysis took too long and was cancelled. Please try again." });
          setStatus("error");
        }
        return;
      }
      const ce = e as ApiClientError;
      setError({ code: ce.code ?? "internal_error", message: ce.message, ...(ce.requestId ? { requestId: ce.requestId } : {}), ...(ce.retryAfterSeconds ? { retryAfterSeconds: ce.retryAfterSeconds } : {}) });
      if (ce.retryAfterSeconds) setCooldown(ce.retryAfterSeconds);
      setStatus("error");
    } finally {
      clearTimeout(timeout);
    }
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStatus("idle");
    setReport(null);
    setError(null);
  }, []);

  const open = useCallback(
    (id: string) => {
      const item = history.find((h) => h.id === id);
      if (item) {
        setReport(item.report);
        setStatus("success");
        setError(null);
      }
    },
    [history],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    setReport(null);
    setStatus("idle");
    setError(null);
  }, []);

  const value = useMemo<Ctx>(
    () => ({ lang, setLang, status, report, error, elapsedMs, cooldown, history, health, healthChecked, submit, reset, open, clearHistory }),
    [lang, setLang, status, report, error, elapsedMs, cooldown, history, health, healthChecked, submit, reset, open, clearHistory],
  );
  return <InvestigationContext.Provider value={value}>{children}</InvestigationContext.Provider>;
}

export function useInvestigation(): Ctx {
  const c = useContext(InvestigationContext);
  if (!c) throw new Error("useInvestigation must be used inside InvestigationProvider");
  return c;
}
