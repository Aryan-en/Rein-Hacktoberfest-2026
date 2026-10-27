"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { buildSegments } from "@/lib/spans";
import type { EvidenceItem, Lang, Severity } from "@/lib/types";

const MARK: Record<Severity, string> = {
  strong: "bg-high/25 text-text underline decoration-high decoration-2 underline-offset-4",
  weak: "bg-medium/20 text-text underline decoration-medium decoration-dotted decoration-2 underline-offset-4",
  info: "bg-blue/20 text-text underline decoration-blue decoration-1 underline-offset-4",
};

interface Props {
  text: string;
  evidence: EvidenceItem[];
  activeId: string | null;
  onActivate(id: string | null): void;
  onSelect(id: string): void;
  fromOcr: boolean;
  lang: Lang;
}

export function HighlightedMessage({ text, evidence, activeId, onActivate, onSelect, fromOcr, lang }: Props) {
  const segments = useMemo(() => buildSegments(text, evidence), [text, evidence]);
  if (!text) return null;
  return (
    <section aria-label={fromOcr ? "Extracted text" : "Your message"} className="card animate-fade-up p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="font-semibold">
          {fromOcr ? (lang === "hi" ? "निकाला गया टेक्स्ट (मशीन द्वारा पढ़ा)" : "Extracted text (machine-read, may contain errors)") : lang === "hi" ? "आपका संदेश" : "Your message"}
        </h3>
        <span className="ml-auto text-xs text-muted">{lang === "hi" ? "रंगीन अंश पर क्लिक करें" : "Click a highlight to see why"}</span>
      </div>
      <p className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap break-words rounded-xl border border-line bg-bg/50 p-4 text-[15px] leading-8">
        {segments.map((s, i) =>
          s.severity ? (
            <mark
              key={i}
              role="button"
              tabIndex={0}
              onMouseEnter={() => onActivate(s.evidenceIds[0] ?? null)}
              onMouseLeave={() => onActivate(null)}
              onClick={() => onSelect(s.evidenceIds[0]!)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(s.evidenceIds[0]!); } }}
              className={cn("cursor-pointer rounded px-0.5 transition-shadow", MARK[s.severity], s.evidenceIds.includes(activeId ?? "") && "ring-2 ring-accent")}
            >
              {s.text}
            </mark>
          ) : (
            <span key={i}>{s.text}</span>
          ),
        )}
      </p>
    </section>
  );
}
