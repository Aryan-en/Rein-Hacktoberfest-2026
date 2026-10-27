import { Info } from "lucide-react";
import { pick } from "@/lib/i18n";
import type { InvestigationReport, Lang } from "@/lib/types";

export function UncertaintyNotice({ report, lang }: { report: InvestigationReport; lang: Lang }) {
  return (
    <section id="limits" aria-label={lang === "hi" ? "सीमाएँ" : "Limitations"} className="scroll-mt-40 animate-fade-up rounded-[14px] lg:scroll-mt-20 border border-blue/35 bg-blue/10 p-5">
      <div className="flex items-center gap-2">
        <Info aria-hidden className="h-4 w-4 text-blue" />
        <h3 className="font-semibold">{lang === "hi" ? "यह जाँच क्या नहीं बता सकती" : "What this investigation can't tell you"}</h3>
      </div>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-[#cbd5e1]">
        {[...report.uncertainties, ...report.limitations].map((t, i) => <li key={i}>{pick(t, lang)}</li>)}
      </ul>
    </section>
  );
}
