import { Loader2 } from "lucide-react";
import type { Lang } from "@/lib/types";

/** Truthful progress: the server does not stream phases, so only elapsed time is shown (no fake steps). */
export function InvestigationProgress({ elapsedMs, lang }: { elapsedMs: number; lang: Lang }) {
  const s = Math.floor(elapsedMs / 1000);
  return (
    <div role="status" aria-live="polite" className="card animate-fade-up p-5">
      <div className="flex items-center gap-3">
        <Loader2 aria-hidden className="h-5 w-5 animate-spin text-accent" />
        <div className="font-medium">{lang === "hi" ? "जाँच जारी है…" : "Investigating…"}</div>
        <div className="ml-auto text-sm tabular-nums text-muted">{s}s</div>
      </div>
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-surface-3">
        <div className="animate-sweep absolute inset-y-0 w-1/3 rounded-full bg-accent" />
      </div>
      <p className="mt-3 text-sm text-muted">
        {s > 20
          ? lang === "hi" ? "अभी भी चल रहा है। AI मॉडल को सामान्य से अधिक समय लग रहा है।" : "Still working. The AI model is taking longer than usual."
          : lang === "hi" ? "नियम-आधारित जाँच और AI विश्लेषण चल रहा है।" : "Running rule-based checks and AI analysis."}
      </p>
    </div>
  );
}
