import { ShieldCheck } from "lucide-react";

export function Logo({ tagline }: { tagline?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-xl border border-accent/40 bg-accent/10 shadow-[0_0_24px_-6px_rgba(45,212,191,0.6)]">
        <ShieldCheck aria-hidden className="h-6 w-6 text-accent" />
      </span>
      <div>
        <div className="text-2xl font-bold leading-none tracking-tight">
          TrustLens <span className="text-accent">AI</span>
        </div>
        {tagline && <div className="mt-1 text-xs text-muted">{tagline}</div>}
      </div>
    </div>
  );
}
