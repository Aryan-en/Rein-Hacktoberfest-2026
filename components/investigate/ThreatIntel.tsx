"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useInvestigation } from "@/context/investigation-context";
import { BUCKETS, sessionDistribution } from "@/lib/stats";
import type { Lang } from "@/lib/types";

export function ThreatIntel({ lang }: { lang: Lang }) {
  const { history } = useInvestigation();
  const dist = useMemo(() => sessionDistribution(history.map((h) => h.report)), [history]);
  const tiles = BUCKETS.slice(0, 4);
  return (
    <section aria-label={lang === "hi" ? "खतरों के पैटर्न" : "Threat patterns"} className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold">
            {lang === "hi" ? "खतरों के पैटर्न" : "Threat Patterns"}
            {dist.sample && <span className="rounded bg-medium/20 px-1.5 py-0.5 text-[10px] font-medium text-medium">{lang === "hi" ? "नमूना पूर्वावलोकन" : "SAMPLE PREVIEW"}</span>}
          </h2>
          <p className="mt-1 text-xs text-muted">
            {dist.sample
              ? lang === "hi" ? "ये उदाहरण संख्याएँ हैं। जाँच चलाएँ तो आपकी अपनी दिखेंगी।" : "Illustrative numbers. Run an investigation to see your own."
              : lang === "hi" ? `इस सत्र की ${dist.total} जाँचों से` : `From the ${dist.total} threat investigation${dist.total === 1 ? "" : "s"} in this session`}
          </p>
        </div>
        <Link href="/history" className="inline-flex shrink-0 items-center gap-1 text-sm text-accent hover:underline">{lang === "hi" ? "इतिहास" : "History"} <ArrowRight aria-hidden className="h-4 w-4" /></Link>
      </div>
      <ul className={`mt-4 grid grid-cols-2 gap-2.5 ${dist.sample ? "opacity-70" : ""}`}>
        {tiles.map((b) => {
          const r = dist.rows.find((x) => x.key === b.key)!;
          return (
            <li key={b.key} className="rounded-xl border border-line bg-surface-2/50 p-3">
              <div className={`text-2xl font-bold tabular-nums ${b.text}`}>{r.pct}%</div>
              <div className="text-xs text-muted">{b.label[lang]}</div>
              <div aria-hidden className="mt-3 flex h-7 items-end gap-1">
                {r.recent.map((h, i) => <span key={i} className="w-full rounded-sm" style={{ height: `${Math.max(12, h * 100)}%`, background: b.color, opacity: 0.35 + 0.65 * (i + 1) / r.recent.length }} />)}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
