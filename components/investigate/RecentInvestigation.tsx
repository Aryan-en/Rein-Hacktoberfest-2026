"use client";

import Link from "next/link";
import { ArrowRight, AlertTriangle, FileText, HelpCircle, ShieldAlert, ShieldCheck, type LucideIcon } from "lucide-react";
import { useMemo } from "react";
import { useInvestigation } from "@/context/investigation-context";
import { cn } from "@/lib/cn";
import { pick, ui } from "@/lib/i18n";
import { CATEGORY_LABEL, RISK_LABEL, RISK_STYLE } from "@/lib/labels";
import { buildSegments } from "@/lib/spans";
import { severityCounts } from "@/lib/stats";
import { relTime } from "@/lib/time";
import type { InvestigationReport, Lang, RiskLevel } from "@/lib/types";

const ICON: Record<RiskLevel, LucideIcon> = { high: ShieldAlert, medium: AlertTriangle, low: ShieldCheck, unknown: HelpCircle };
const MARK = { strong: "text-high font-medium", weak: "text-medium", info: "text-blue" } as const;

/** Ring of REAL indicator counts by severity (not a probability or score). */
function SeverityRing({ counts, lang }: { counts: { strong: number; weak: number; info: number }; lang: Lang }) {
  const total = counts.strong + counts.weak + counts.info;
  const R = 26;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const segs = [
    { n: counts.strong, color: "#ef4444" },
    { n: counts.weak, color: "#f59e0b" },
    { n: counts.info, color: "#3b82f6" },
  ];
  return (
    <div role="img" aria-label={lang === "hi" ? `${total} संकेत: ${counts.strong} मज़बूत, ${counts.weak} चेतावनी, ${counts.info} टिप्पणी` : `${total} indicators: ${counts.strong} strong, ${counts.weak} warning, ${counts.info} note`} className="relative h-[68px] w-[68px] shrink-0">
      <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
        <circle cx="32" cy="32" r={R} fill="none" stroke="#22324d" strokeWidth="6" />
        {total > 0 && segs.map((s, i) => {
          if (!s.n) return null;
          const len = (s.n / total) * C;
          const el = <circle key={i} cx="32" cy="32" r={R} fill="none" stroke={s.color} strokeWidth="6" strokeLinecap="butt" strokeDasharray={`${Math.max(len - 2, 1)} ${C}`} strokeDashoffset={-offset} />;
          offset += len;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div><div className="text-lg font-bold leading-none">{total}</div><div className="mt-0.5 text-[9px] text-muted">{lang === "hi" ? "संकेत" : "Indicators"}</div></div>
      </div>
    </div>
  );
}

function Snippet({ r }: { r: InvestigationReport }) {
  const text = r.input.displayText.slice(0, 150);
  const segs = useMemo(
    () => buildSegments(text, r.evidence.filter((e) => e.span && e.span[1] <= text.length)),
    [text, r.evidence],
  );
  return (
    <blockquote className="mt-3 rounded-lg border border-line border-l-2 border-l-high/70 bg-bg/40 px-3 py-2.5 text-sm leading-relaxed text-[#cbd5e1]">
      “{segs.map((s, i) => (s.severity ? <span key={i} className={MARK[s.severity]}>{s.text}</span> : <span key={i}>{s.text}</span>))}
      {r.input.displayText.length > 150 && "…"}”
    </blockquote>
  );
}

export function RecentInvestigation({ lang }: { lang: Lang }) {
  const { history, open } = useInvestigation();
  const latest = history[0];
  const r = latest?.report;
  const st = r ? RISK_STYLE[r.classification.risk] : null;
  const Icon = r ? ICON[r.classification.risk] : FileText;
  const suspiciousUrls = r ? r.urls.filter((u) => u.signals.some((s) => s.severity !== "info")).length : 0;
  const counts = r ? severityCounts(r) : { strong: 0, weak: 0, info: 0 };
  return (
    <section aria-label={ui("recent", lang)} className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{ui("recent", lang)}</h2>
        <Link href="/history" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">{ui("viewAll", lang)} <ArrowRight aria-hidden className="h-4 w-4" /></Link>
      </div>
      {!latest || !r || !st ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">{ui("noneYet", lang)}</p>
      ) : (
        <button type="button" onClick={() => open(latest.id)} className="mt-4 block w-full rounded-xl border border-line bg-bg/30 p-4 text-left transition-colors hover:border-accent/40">
          <div className="flex items-center gap-2 text-sm">
            <FileText aria-hidden className="h-4 w-4 shrink-0 text-muted" />
            <span className="line-clamp-1 min-w-0 flex-1">{r.input.displayText || (lang === "hi" ? "(स्क्रीनशॉट)" : "(screenshot)")}</span>
            <span className="shrink-0 text-xs text-muted">{relTime(latest.at, lang)}</span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className={cn("grid h-14 w-14 shrink-0 place-items-center rounded-xl border", st.border, st.bg)}><Icon aria-hidden className={cn("h-7 w-7", st.text)} /></span>
            <div className="min-w-0 flex-1">
              <div className={cn("font-semibold", st.text)}>{pick(RISK_LABEL[r.classification.risk], lang)}</div>
              <div className={cn("text-sm", st.text)}>{pick(CATEGORY_LABEL[r.classification.category], lang)}</div>
            </div>
            <SeverityRing counts={counts} lang={lang} />
          </div>
          {r.input.displayText && <Snippet r={r} />}
          <dl className="mt-3 grid grid-cols-3 gap-2">
            {[
              [r.evidence.length, ui("evidenceFound", lang)],
              [counts.strong + counts.weak, ui("riskFactors", lang)],
              [suspiciousUrls, lang === "hi" ? "संदिग्ध लिंक" : "Suspicious URL"],
            ].map(([n, l]) => (
              <div key={String(l)} className="rounded-lg border border-line bg-surface-2/50 p-2.5">
                <dd className="text-xl font-semibold leading-none">{n}</dd>
                <dt className="mt-1 text-[11px] text-muted">{l}</dt>
              </div>
            ))}
          </dl>
        </button>
      )}
    </section>
  );
}
