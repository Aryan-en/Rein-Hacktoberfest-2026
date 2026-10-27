"use client";

import { ChevronDown, Download, FileJson, FileText, Printer, ClipboardCopy } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { download, reportFilename, reportToMarkdown } from "@/lib/export";
import { pick } from "@/lib/i18n";
import type { InvestigationReport, Lang } from "@/lib/types";

export function ExportMenu({ report, lang }: { report: InvestigationReport; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", close); };
  }, [open]);

  const say = (m: string) => { setToast(m); setTimeout(() => setToast(""), 1800); };
  const items = [
    { icon: FileText, label: lang === "hi" ? "Markdown डाउनलोड" : "Download Markdown", run: () => download(reportFilename("md"), "text/markdown", reportToMarkdown(report, lang)) },
    { icon: FileJson, label: lang === "hi" ? "JSON डाउनलोड (दोनों भाषाएँ)" : "Download JSON (both languages)", run: () => download(reportFilename("json"), "application/json", JSON.stringify(report, null, 2)) },
    { icon: Printer, label: lang === "hi" ? "प्रिंट / PDF सहेजें" : "Print / Save as PDF", run: () => window.print() },
    { icon: ClipboardCopy, label: lang === "hi" ? "सारांश कॉपी करें" : "Copy summary", run: () => { void navigator.clipboard?.writeText(`${pick(report.classification.headline, lang)}\n\n${report.explanation ? pick(report.explanation.summary, lang) : ""}`.trim()); say(lang === "hi" ? "कॉपी हो गया" : "Copied"); } },
  ];
  return (
    <div ref={ref} className="no-print relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface-2 px-4 text-sm font-medium hover:border-accent/50">
        <Download aria-hidden className="h-4 w-4" /> {lang === "hi" ? "रिपोर्ट निर्यात करें" : "Export report"} <ChevronDown aria-hidden className="h-4 w-4" />
      </button>
      {open && (
        <div role="menu" className="border-line-strong bg-[#101b2d] absolute right-0 z-30 mt-2 w-72 rounded-xl border border-line p-1.5 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.7)]">
          {items.map((it) => (
            <button key={it.label} role="menuitem" type="button" onClick={() => { it.run(); setOpen(false); }} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm hover:bg-surface-3">
              <it.icon aria-hidden className="h-4 w-4 text-accent" /> {it.label}
            </button>
          ))}
        </div>
      )}
      <span role="status" aria-live="polite" className="sr-only">{toast}</span>
      {toast && <span aria-hidden className="absolute right-0 top-full mt-2 rounded-lg bg-surface-3 px-3 py-1.5 text-xs">{toast}</span>}
    </div>
  );
}
