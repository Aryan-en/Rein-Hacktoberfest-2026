"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { History, Image as ImageIcon, Link2, MessageSquareText, Search, Trash2, X, type LucideIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { useInvestigation } from "@/context/investigation-context";
import { cn } from "@/lib/cn";
import { pick, ui } from "@/lib/i18n";
import { CATEGORY_LABEL, RISK_LABEL, RISK_STYLE } from "@/lib/labels";
import { relTime } from "@/lib/time";
import type { RiskLevel } from "@/lib/types";

const TYPE_ICON: Record<string, LucideIcon> = { text: MessageSquareText, url: Link2, image: ImageIcon };
const FILTERS: Array<"all" | RiskLevel> = ["all", "high", "medium", "low", "unknown"];

export function HistoryList() {
  const { history, open, lang, clearHistory, removeFromHistory } = useInvestigation();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | RiskLevel>("all");
  const [q, setQ] = useState("");
  const [confirm, setConfirm] = useState(false);
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: history.length, high: 0, medium: 0, low: 0, unknown: 0 };
    for (const h of history) c[h.report.classification.risk]!++;
    return c;
  }, [history]);

  const needle = q.trim().toLowerCase();
  const rows = history.filter((h) => (filter === "all" || h.report.classification.risk === filter) && (!needle || h.report.input.displayText.toLowerCase().includes(needle) || pick(CATEGORY_LABEL[h.report.classification.category], lang).toLowerCase().includes(needle)));

  return (
    <div className="space-y-6">
      <PageHeader
        icon={History}
        title={ui("navHistory", lang)}
        subtitle={t("Investigations from this browser session only. They are cleared when you refresh the page. TrustLens does not store your content.", "केवल इस ब्राउज़र सत्र की जाँचें। पेज रीफ़्रेश करने पर ये मिट जाती हैं। TrustLens आपकी सामग्री सहेजता नहीं।")}
        actions={history.length > 0 && (
          confirm ? (
            <div role="alertdialog" aria-label={t("Confirm clear", "साफ़ करने की पुष्टि")} className="flex items-center gap-2 rounded-xl border border-high/40 bg-high/10 p-2 pl-3 text-sm">
              {t("Clear all?", "सब साफ़ करें?")}
              <button type="button" onClick={() => { clearHistory(); setConfirm(false); }} className="min-h-9 rounded-lg bg-high px-3 font-medium text-white">{t("Yes, clear", "हाँ, साफ़ करें")}</button>
              <button type="button" onClick={() => setConfirm(false)} className="min-h-9 rounded-lg px-3 text-muted hover:text-text">{t("Cancel", "रद्द करें")}</button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirm(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm text-muted hover:border-high/50 hover:text-high"><Trash2 aria-hidden className="h-4 w-4" />{t("Clear history", "इतिहास साफ़ करें")}</button>
          )
        )}
      />

      {history.length === 0 ? (
        <div className="card grid place-items-center gap-3 p-10 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-surface-2"><History aria-hidden className="h-7 w-7 text-muted" /></span>
          <p className="max-w-md text-muted">{ui("noneYet", lang)}</p>
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-[#22d3ee] px-5 font-semibold text-accent-fg"><Search aria-hidden className="h-4 w-4" />{t("Start an investigation", "जाँच शुरू करें")}</Link>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div role="group" aria-label={t("Filter by risk", "जोखिम से फ़िल्टर")} className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={cn("min-h-10 rounded-full border px-4 text-sm transition-colors", filter === f ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:text-text")}>
                  {f === "all" ? t("All", "सभी") : pick(RISK_LABEL[f], lang).replace(/ risk| जोखिम/i, "")} <span className="ml-1 tabular-nums opacity-70">{counts[f]}</span>
                </button>
              ))}
            </div>
            <div className="relative ml-auto w-full sm:w-64">
              <label htmlFor="hist-q" className="sr-only">{t("Filter investigations", "जाँचें फ़िल्टर करें")}</label>
              <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input id="hist-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("Filter by text or category…", "टेक्स्ट या श्रेणी से फ़िल्टर…")} className="min-h-10 w-full rounded-full border border-line bg-bg/50 pl-9 pr-9 text-sm outline-none placeholder:text-faint focus:border-accent/60" />
              {q && <button type="button" aria-label={t("Clear filter", "फ़िल्टर हटाएँ")} onClick={() => setQ("")} className="absolute right-1.5 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-muted hover:text-text"><X aria-hidden className="h-4 w-4" /></button>}
            </div>
          </div>
          {rows.length === 0 ? (
            <p className="card p-6 text-muted">{t("No investigations match this filter.", "इस फ़िल्टर से कोई जाँच मेल नहीं खाती।")}</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((h) => {
                const r = h.report;
                const st = RISK_STYLE[r.classification.risk];
                const TypeIcon = TYPE_ICON[r.input.type] ?? MessageSquareText;
                const indicators = new Set(r.signals.map((s) => s.id)).size;
                return (
                  <li key={h.id} className="card group flex items-stretch overflow-hidden">
                    <button type="button" onClick={() => { open(h.id); router.push("/"); }} className="flex min-w-0 flex-1 items-center gap-4 p-4 text-left transition-colors hover:bg-surface-2/40">
                      <span className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl border", st.border, st.bg)}><TypeIcon aria-hidden className={cn("h-5 w-5", st.text)} /></span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-1 text-[15px] text-text">{r.input.displayText || t("(screenshot)", "(स्क्रीनशॉट)")}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                          <span className={cn("rounded border px-1.5 py-0.5 font-semibold", st.border, st.text)}>{pick(RISK_LABEL[r.classification.risk], lang)}</span>
                          <span>{pick(CATEGORY_LABEL[r.classification.category], lang)}</span>
                          <span>{indicators} {t("indicators", "संकेत")}</span>
                          <span>{r.urls.length} {t("links", "लिंक")}</span>
                          <span>{relTime(h.at, lang)}</span>
                        </span>
                      </span>
                    </button>
                    <button type="button" aria-label={t("Remove from history", "इतिहास से हटाएँ")} onClick={() => removeFromHistory(h.id)} className="grid w-12 shrink-0 place-items-center border-l border-line text-muted opacity-60 transition hover:bg-high/10 hover:text-high hover:opacity-100 focus-visible:opacity-100"><Trash2 aria-hidden className="h-4 w-4" /></button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
