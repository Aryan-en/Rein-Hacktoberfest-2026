"use client";

import { CheckCircle2, ChevronDown, CircleAlert, CircleHelp, Eye, Sparkles, XCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { hindiMissing, pick } from "@/lib/i18n";
import type { EvidenceItem, Lang, Severity } from "@/lib/types";

const SEV_TEXT: Record<Severity, string> = { strong: "text-high", weak: "text-medium", info: "text-blue" };
const SEV_LABEL: Record<Severity, { en: string; hi: string }> = {
  strong: { en: "Strong indicator", hi: "मज़बूत संकेत" },
  weak: { en: "Warning sign", hi: "चेतावनी संकेत" },
  info: { en: "Note", hi: "टिप्पणी" },
};
const PROV: Record<EvidenceItem["provenance"], { en: string; hi: string; icon: typeof Eye }> = {
  observed: { en: "Observed", hi: "देखा गया", icon: Eye },
  heuristic: { en: "Heuristic indicator", hi: "अनुमान-आधारित संकेत", icon: CircleAlert },
  ai_interpretation: { en: "AI interpretation", hi: "AI की व्याख्या", icon: Sparkles },
};
const ORDER: Record<Severity, number> = { strong: 0, weak: 1, info: 2 };

function EvidenceCard({ item, lang, active, defaultOpen, onHover }: { item: EvidenceItem; lang: Lang; active: boolean; defaultOpen: boolean; onHover(id: string | null): void }) {
  const [open, setOpen] = useState(defaultOpen);
  const P = PROV[item.provenance];
  const SevIcon = item.severity === "strong" ? CircleAlert : item.severity === "weak" ? CircleHelp : Eye;
  return (
    <li
      id={`ev-${item.id}`}
      onMouseEnter={() => onHover(item.id)}
      onMouseLeave={() => onHover(null)}
      className={cn("rounded-xl border bg-bg/40 transition-colors", active ? "animate-flash border-accent/60" : "border-line")}
    >
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex min-h-12 w-full items-center gap-3 px-4 py-3 text-left">
        <SevIcon aria-hidden className={cn("h-4 w-4 shrink-0", SEV_TEXT[item.severity])} />
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium">{pick(item.title, lang)}</span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted">
            <span className={cn("rounded border border-line-strong px-1.5 py-0.5", SEV_TEXT[item.severity])}>{SEV_LABEL[item.severity][lang]}</span>
            <span className="inline-flex items-center gap-1 rounded border border-line-strong px-1.5 py-0.5"><P.icon aria-hidden className="h-3 w-3" />{P[lang]}</span>
            {item.source === "ocr" && <span className="rounded border border-line-strong px-1.5 py-0.5">OCR</span>}
          </span>
        </span>
        <ChevronDown aria-hidden className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="space-y-3 border-t border-line px-4 pb-4 pt-3 text-sm">
          {item.quote && (
            <div>
              <code className="block break-words rounded-lg border border-line bg-surface px-3 py-2 font-mono text-[13px] text-[#cbd5e1]">{item.quote}</code>
              <p className={cn("mt-1.5 flex items-center gap-1.5 text-xs", item.quoteVerified ? "text-low" : "text-medium")}>
                {item.quoteVerified ? <CheckCircle2 aria-hidden className="h-3.5 w-3.5" /> : <XCircle aria-hidden className="h-3.5 w-3.5" />}
                {item.quoteVerified
                  ? lang === "hi" ? "उद्धरण आपकी सामग्री में मिला" : "Quote found in your content"
                  : lang === "hi" ? "उद्धरण सामग्री में नहीं मिला: असत्यापित माना गया" : "Quote not found verbatim: treated as unverified"}
              </p>
            </div>
          )}
          <p lang={hindiMissing(item.explanation, lang) ? "en" : lang} className="leading-relaxed text-[#cbd5e1]">{pick(item.explanation, lang)}</p>
          {item.provenance === "heuristic" && <p className="text-xs text-muted">{lang === "hi" ? "यह संकेत है, प्रमाण नहीं।" : "Indicator, not proof."}</p>}
        </div>
      )}
    </li>
  );
}

export function EvidenceList({ evidence, activeId, onHover, lang }: { evidence: EvidenceItem[]; activeId: string | null; onHover(id: string | null): void; lang: Lang }) {
  const sorted = [...evidence].sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
  return (
    <section aria-label={lang === "hi" ? "सबूत" : "Evidence"} className="card animate-fade-up p-5">
      <h3 className="font-semibold">{lang === "hi" ? "सबूत" : "Evidence"} <span className="text-sm font-normal text-muted">({evidence.length})</span></h3>
      {sorted.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{lang === "hi" ? "कोई विशिष्ट सबूत चिह्नित नहीं हुआ।" : "No specific evidence items were identified."}</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {sorted.map((e, i) => <EvidenceCard key={e.id} item={e} lang={lang} active={activeId === e.id} defaultOpen={i < 3} onHover={onHover} />)}
        </ul>
      )}
    </section>
  );
}
