import { Sparkles } from "lucide-react";
import { hindiMissing, pick } from "@/lib/i18n";
import { TECHNIQUE_LABEL } from "@/lib/labels";
import type { InvestigationReport, Lang } from "@/lib/types";

export function ExplanationPanel({ report, lang }: { report: InvestigationReport; lang: Lang }) {
  const ex = report.explanation;
  return (
    <section aria-label={lang === "hi" ? "AI व्याख्या" : "AI explanation"} className="card animate-fade-up p-5">
      <div className="flex items-center gap-2">
        <Sparkles aria-hidden className="h-4 w-4 text-accent" />
        <h3 className="font-semibold">{lang === "hi" ? "AI व्याख्या" : "AI explanation"}</h3>
        <span className="ml-auto rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-[11px] text-accent">{lang === "hi" ? "AI की व्याख्या, सत्यापन नहीं" : "AI interpretation, not verification"}</span>
      </div>
      {!ex ? (
        <p className="mt-3 text-sm text-muted">{lang === "hi" ? "इस रिपोर्ट के लिए AI विश्लेषण उपलब्ध नहीं था।" : "AI analysis was unavailable for this report."}</p>
      ) : (
        <>
          <p lang={hindiMissing(ex.summary, lang) ? "en" : lang} className="mt-3 text-[15px] leading-relaxed text-[#dbe4f0]">{pick(ex.summary, lang)}</p>
          {hindiMissing(ex.summary, lang) && <p className="mt-1 text-xs text-muted">Hindi unavailable for this item; showing English.</p>}
          {report.manipulationTechniques.length > 0 && (
            <div className="mt-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted">{lang === "hi" ? "हेरफेर की तकनीकें" : "Manipulation techniques"}</div>
              <ul className="mt-2 space-y-2">
                {report.manipulationTechniques.map((t, i) => (
                  <li key={i} className="rounded-lg border border-line bg-bg/40 p-3 text-sm">
                    <span className="font-medium text-accent">{pick(TECHNIQUE_LABEL[t.id], lang)}</span>
                    <span lang={hindiMissing(t.explanation, lang) ? "en" : lang} className="text-muted"> · {pick(t.explanation, lang)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
