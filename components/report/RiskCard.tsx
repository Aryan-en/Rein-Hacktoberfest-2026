import { AlertTriangle, HelpCircle, ShieldAlert, ShieldCheck, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { hindiMissing, pick } from "@/lib/i18n";
import { BASIS_LABEL, CATEGORY_LABEL, RISK_LABEL, RISK_STYLE } from "@/lib/labels";
import type { InvestigationReport, Lang, RiskLevel } from "@/lib/types";

const ICON: Record<RiskLevel, LucideIcon> = { high: ShieldAlert, medium: AlertTriangle, low: ShieldCheck, unknown: HelpCircle };

const SUBCAPTION: Record<"low" | "unknown", { en: string; hi: string }> = {
  low: { en: "No strong scam indicators found. This is not a guarantee of safety.", hi: "ठगी के कोई मज़बूत संकेत नहीं मिले। यह सुरक्षा की गारंटी नहीं है।" },
  unknown: { en: "Not enough information to classify.", hi: "वर्गीकरण के लिए पर्याप्त जानकारी नहीं।" },
};

export function RiskCard({ report, lang }: { report: InvestigationReport; lang: Lang }) {
  const c = report.classification;
  const st = RISK_STYLE[c.risk];
  const Icon = ICON[c.risk];
  return (
    <section id="overview" aria-label={lang === "hi" ? "जोखिम वर्गीकरण" : "Risk classification"} className={cn("card scroll-mt-40 animate-fade-up border p-5 sm:p-6 lg:scroll-mt-20", st.border, st.glow)}>
      <div className="flex flex-wrap items-start gap-4">
        <div className={cn("grid h-16 w-16 shrink-0 place-items-center rounded-2xl border", st.border, st.bg)}>
          <Icon aria-hidden className={cn("h-8 w-8", st.text)} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-sm font-semibold uppercase tracking-wider", st.text)}>{pick(RISK_LABEL[c.risk], lang)}</span>
            <span className="rounded-full border border-line-strong bg-surface-2 px-3 py-0.5 text-xs text-muted">{pick(CATEGORY_LABEL[c.category], lang)}</span>
          </div>
          <h2 lang={lang} className="mt-1.5 text-xl font-semibold leading-snug sm:text-2xl">{pick(c.headline, lang)}</h2>
          {(c.risk === "low" || c.risk === "unknown") && <p className="mt-2 text-sm text-muted">{SUBCAPTION[c.risk][lang]}</p>}
        </div>
      </div>
      {c.rationale.length > 0 && (
        <details className="group mt-5 rounded-xl border border-line bg-bg/40" open={c.risk === "high"}>
          <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-sm font-medium">
            {lang === "hi" ? "यह रेटिंग क्यों" : "Why this rating"}
            <span aria-hidden className="text-muted transition-transform group-open:rotate-180">⌄</span>
          </summary>
          <ul className="space-y-2.5 px-4 pb-4">
            {c.rationale.map((r, i) => (
              <li key={i} className="flex flex-wrap items-start gap-2 text-sm">
                <span className="rounded-md border border-line-strong bg-surface-2 px-2 py-0.5 text-[11px] text-muted">{pick(BASIS_LABEL[r.basis], lang)}</span>
                <span lang={hindiMissing(r.text, lang) ? "en" : lang} className="min-w-0 flex-1 text-[#cbd5e1]">{pick(r.text, lang)}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
