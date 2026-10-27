import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ icon: Icon, title, subtitle, actions }: { icon: LucideIcon; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4 pt-2 lg:pt-10">
      <div className="flex items-start gap-4">
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-accent/30 bg-accent/10 shadow-[0_0_24px_-8px_rgba(45,212,191,0.5)]">
          <Icon aria-hidden className="h-6 w-6 text-accent" />
        </span>
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-[15px] leading-relaxed text-muted">{subtitle}</p>}
        </div>
      </div>
      {actions}
    </header>
  );
}
