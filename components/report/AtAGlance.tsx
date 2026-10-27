import { cn } from "@/lib/cn";
import { severityCounts } from "@/lib/stats";
import type { InvestigationReport, Lang } from "@/lib/types";

/** Real counts from the report; nothing here is estimated. */
export function AtAGlance({ report, lang }: { report: InvestigationReport; lang: Lang }) {
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  const sev = severityCounts(report);
  const quoted = report.evidence.filter((e) => e.quote && e.provenance === "ai_interpretation");
  const verified = quoted.filter((e) => e.quoteVerified).length;
  const ai = report.model.mode === "ai_assisted";
  const tiles = [
    { label: t("Indicators", "संकेत"), value: String(sev.strong + sev.weak + sev.info), sub: t(`${sev.strong} strong · ${sev.weak} warning`, `${sev.strong} मज़बूत · ${sev.weak} चेतावनी`), tone: sev.strong ? "text-high" : sev.weak ? "text-medium" : "text-text" },
    { label: t("AI quotes verified", "AI उद्धरण सत्यापित"), value: ai ? `${verified}/${quoted.length}` : "—", sub: ai ? t("found in your content", "आपकी सामग्री में मिले") : t("AI unavailable", "AI उपलब्ध नहीं"), tone: ai && quoted.length && verified === quoted.length ? "text-low" : "text-text" },
    { label: t("Links analyzed", "जाँचे गए लिंक"), value: String(report.urls.length), sub: t("never opened", "कभी खोले नहीं गए"), tone: "text-text" },
    { label: t("Analysis", "विश्लेषण"), value: ai ? t("AI + rules", "AI + नियम") : t("Rules only", "केवल नियम"), sub: ai ? (report.model.usedModel ?? "") : t("no AI used", "AI का उपयोग नहीं"), tone: ai ? "text-accent" : "text-medium" },
  ];
  return (
    <ul aria-label={t("At a glance", "एक नज़र में")} className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {tiles.map((x) => (
        <li key={x.label} className="card min-w-0 p-3.5">
          <div className="text-[11px] font-medium uppercase tracking-wider text-muted">{x.label}</div>
          <div className={cn("mt-1 truncate text-xl font-bold tabular-nums", x.tone)}>{x.value}</div>
          <div className="truncate text-xs text-muted" title={x.sub}>{x.sub}</div>
        </li>
      ))}
    </ul>
  );
}
