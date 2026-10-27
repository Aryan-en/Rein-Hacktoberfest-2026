"use client";

import { useEffect, useRef, useState } from "react";
import type { InvestigationReport, Lang } from "@/lib/types";
import { Plus } from "lucide-react";
import { AtAGlance } from "./AtAGlance";
import { ExplanationPanel } from "./ExplanationPanel";
import { EvidenceList } from "./EvidenceList";
import { ExportMenu } from "./ExportMenu";
import { HighlightedMessage } from "./HighlightedMessage";
import { ModelDisclosureBar } from "./ModelDisclosureBar";
import { Recommendations } from "./Recommendations";
import { ReportNav } from "./ReportNav";
import { RiskCard } from "./RiskCard";
import { UncertaintyNotice } from "./UncertaintyNotice";
import { UrlForensics } from "./UrlForensics";

export function ReportView({ report, lang, onNew }: { report: InvestigationReport; lang: Lang; onNew?: () => void }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const headRef = useRef<HTMLDivElement>(null);

  // Move focus to the report when a new one arrives (screen readers + mobile scroll).
  useEffect(() => {
    headRef.current?.focus({ preventScroll: true });
    headRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }, [report.reportId]);

  function select(id: string) {
    setFlashId(id);
    document.getElementById(`ev-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => setFlashId(null), 1000);
  }

  const urlFirst = report.input.type === "url";
  const urlPanel = <UrlForensics urls={report.urls} lang={lang} />;
  const hasActions = report.classification.risk === "high" || report.classification.risk === "medium";

  return (
    <div className="space-y-4">
      <div ref={headRef} tabIndex={-1} className="flex flex-wrap items-center justify-between gap-3 outline-none">
        <h2 className="text-lg font-semibold">{lang === "hi" ? "जाँच रिपोर्ट" : "Investigation report"}</h2>
        <div className="flex flex-wrap items-center gap-3">
          {onNew && <button type="button" onClick={onNew} className="no-print inline-flex min-h-11 items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 text-sm font-medium text-accent hover:bg-accent/20"><Plus aria-hidden className="h-4 w-4" />{lang === "hi" ? "नई जाँच" : "New investigation"}</button>}
          {hasActions && <a href="#actions" className="no-print text-sm text-accent hover:underline">{lang === "hi" ? "क्या करें, देखें ↓" : "Jump to what to do ↓"}</a>}
          <ExportMenu report={report} lang={lang} />
        </div>
      </div>
      <ReportNav report={report} lang={lang} />
      <ModelDisclosureBar model={report.model} lang={lang} />
      <RiskCard report={report} lang={lang} />
      <AtAGlance report={report} lang={lang} />
      {urlFirst && urlPanel}
      <ExplanationPanel report={report} lang={lang} />
      {report.input.type !== "url" && (
        <HighlightedMessage
          text={report.input.displayText}
          evidence={report.evidence}
          activeId={flashId ?? activeId}
          onActivate={setActiveId}
          onSelect={select}
          fromOcr={report.input.textSource === "ocr"}
          lang={lang}
        />
      )}
      <EvidenceList evidence={report.evidence} activeId={flashId ?? activeId} onHover={setActiveId} lang={lang} />
      {!urlFirst && urlPanel}
      <Recommendations items={report.recommendations} lang={lang} />
      <UncertaintyNotice report={report} lang={lang} />
      <p className="px-1 text-xs text-muted">
        {lang === "hi" ? "रिपोर्ट" : "Report"} {report.reportId.slice(0, 8)} · {new Date(report.generatedAt).toLocaleString()} · {(report.timings.totalMs / 1000).toFixed(1)}s
      </p>
    </div>
  );
}
