"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { InvestigationReport, Lang } from "@/lib/types";

/** Sticky in-report navigation with scroll-spy. Only lists sections that exist in this report. */
export function ReportNav({ report, lang }: { report: InvestigationReport; lang: Lang }) {
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  const items = [
    { id: "overview", label: t("Overview", "सारांश") },
    ...(report.evidence.length ? [{ id: "evidence", label: t("Evidence", "सबूत") }] : []),
    ...(report.urls.length ? [{ id: "links", label: t("Links", "लिंक") }] : []),
    { id: "actions", label: t("Actions", "कार्रवाई") },
    { id: "limits", label: t("Limits", "सीमाएँ") },
  ];
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e);
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    els.forEach((e) => obs.observe(e));
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report.reportId]);

  return (
    <nav aria-label={t("Report sections", "रिपोर्ट के भाग")} className="no-print glass sticky top-[104px] z-10 -mx-1 overflow-x-auto rounded-xl border border-line px-1.5 py-1.5 lg:top-3">
      <ul className="flex min-w-max gap-1">
        {items.map((i) => (
          <li key={i.id}>
            <a href={`#${i.id}`} aria-current={active === i.id ? "location" : undefined} className={cn("inline-flex min-h-9 items-center rounded-lg px-3 text-sm transition-colors", active === i.id ? "bg-accent/15 text-accent" : "text-muted hover:bg-surface-3 hover:text-text")}>{i.label}</a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
