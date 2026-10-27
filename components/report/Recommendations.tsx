import { ListChecks } from "lucide-react";
import { hindiMissing, pick } from "@/lib/i18n";
import type { InvestigationReport, Lang } from "@/lib/types";

const GROUPS: Array<{ p: "now" | "soon" | "info"; en: string; hi: string }> = [
  { p: "now", en: "Do this now", hi: "अभी करें" },
  { p: "soon", en: "Then", hi: "इसके बाद" },
  { p: "info", en: "Good to know", hi: "जानने योग्य" },
];

export function Recommendations({ items, lang }: { items: InvestigationReport["recommendations"]; lang: Lang }) {
  return (
    <section id="actions" aria-label={lang === "hi" ? "सुरक्षा सुझाव" : "Safety recommendations"} className="card scroll-mt-40 animate-fade-up p-5 lg:scroll-mt-20">
      <div className="flex items-center gap-2">
        <ListChecks aria-hidden className="h-4 w-4 text-accent" />
        <h3 className="font-semibold">{lang === "hi" ? "सुझाई गई कार्रवाई" : "Recommended actions"}</h3>
      </div>
      <div className="mt-3 space-y-4">
        {GROUPS.map((g) => {
          const list = items.filter((i) => i.priority === g.p);
          if (!list.length) return null;
          return (
            <div key={g.p}>
              <div className="text-xs font-medium uppercase tracking-wider text-muted">{g[lang]}</div>
              <ul className="mt-2 space-y-2">
                {list.map((r) => (
                  <li key={r.id} lang={hindiMissing(r.text, lang) ? "en" : lang} className="flex gap-3 rounded-lg border border-line bg-bg/40 p-3 text-sm leading-relaxed text-[#dbe4f0]">
                    <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    {pick(r.text, lang)}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
