"use client";

import { useMemo } from "react";
import { useInvestigation } from "@/context/investigation-context";
import { BUCKETS, sessionDistribution } from "@/lib/stats";
import type { Lang } from "@/lib/types";

/** Hero overlay: category mix of THIS session's investigations (sample preview until one is run). */
export function SessionMix({ lang }: { lang: Lang }) {
  const { history } = useInvestigation();
  const dist = useMemo(() => sessionDistribution(history.map((h) => h.report)), [history]);
  return (
    <aside aria-label={lang === "hi" ? "सत्र में खतरों का मिश्रण" : "Session threat mix"} className="absolute right-0 top-[72px] z-10 hidden w-[190px] rounded-lg border border-line bg-bg/70 p-2.5 backdrop-blur xl:block">
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] font-medium uppercase tracking-wider text-accent">
        <span>{lang === "hi" ? "सत्र का खतरा-मिश्रण" : "Session threat mix"}</span>
        {dist.sample && <span className="rounded bg-medium/20 px-1 py-0.5 text-[9px] text-medium">{lang === "hi" ? "नमूना" : "SAMPLE"}</span>}
      </div>
      <ul className="space-y-1">
        {dist.rows.map((r) => {
          const b = BUCKETS.find((x) => x.key === r.key)!;
          return (
            <li key={r.key} className={`flex items-center justify-between rounded border border-line/70 px-2 py-0.5 text-[11px] ${dist.sample ? "opacity-60" : ""}`}>
              <span className={b.text}>{b.label[lang]}</span>
              <span className="tabular-nums text-text">{r.pct}%</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
