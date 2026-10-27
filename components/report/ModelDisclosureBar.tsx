import { Cpu, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Lang, ModelDisclosure } from "@/lib/types";

export function ModelDisclosureBar({ model, lang }: { model: ModelDisclosure; lang: Lang }) {
  const degraded = model.mode === "deterministic_only";
  if (!degraded && !model.fellBack) {
    return (
      <p className="flex items-center gap-2 px-1 text-xs text-muted">
        <Cpu aria-hidden className="h-3.5 w-3.5" />
        {lang === "hi" ? "विश्लेषण मॉडल:" : "Analyzed with"} <span className="font-mono text-[#cbd5e1]">{model.usedModel}</span>
      </p>
    );
  }
  const Icon = degraded ? TriangleAlert : Info;
  return (
    <div role="status" className={cn("rounded-xl border p-4 text-sm", degraded ? "border-medium/40 bg-medium/10" : "border-blue/40 bg-blue/10")}>
      <div className="flex items-start gap-3">
        <Icon aria-hidden className={cn("mt-0.5 h-4 w-4 shrink-0", degraded ? "text-medium" : "text-blue")} />
        <div className="min-w-0 flex-1">
          <div className="font-medium">
            {degraded
              ? lang === "hi" ? "AI विश्लेषण उपलब्ध नहीं। केवल नियम-आधारित निष्कर्ष दिखाए जा रहे हैं।" : "AI analysis unavailable. Showing rule-based findings only."
              : lang === "hi" ? `प्राथमिक मॉडल उपलब्ध नहीं था; ${model.usedModel} से विश्लेषण हुआ।` : `Primary model unavailable; analyzed with ${model.usedModel}.`}
          </div>
          {degraded && model.degradedReason && <p className="mt-1 text-muted">{model.degradedReason}</p>}
          {model.attempts.length > 0 && (
            <details className="mt-2 text-xs text-muted">
              <summary className="cursor-pointer">{lang === "hi" ? "प्रयासों का विवरण" : "Attempt details"}</summary>
              <ul className="mt-1 space-y-0.5 font-mono">
                {model.attempts.map((a, i) => <li key={i}>{a.model}: {a.outcome} ({a.latencyMs} ms)</li>)}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
