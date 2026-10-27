"use client";

import { Languages } from "lucide-react";
import { useInvestigation } from "@/context/investigation-context";
import { cn } from "@/lib/cn";
import type { Lang } from "@/lib/types";

const OPTIONS: Array<{ v: Lang; label: string; aria: string }> = [
  { v: "en", label: "EN", aria: "English" },
  { v: "hi", label: "हिन्दी", aria: "हिन्दी (Hindi)" },
];

export function LanguageSwitcher({ className }: { className?: string }) {
  const { lang, setLang } = useInvestigation();
  return (
    <div role="radiogroup" aria-label="Language" className={cn("glass inline-flex items-center gap-1 rounded-full border border-line p-1", className)}>
      <Languages aria-hidden className="ml-2 h-4 w-4 text-muted" />
      {OPTIONS.map((o) => (
        <button
          key={o.v}
          role="radio"
          aria-checked={lang === o.v}
          aria-label={o.aria}
          onClick={() => setLang(o.v)}
          className={cn(
            "min-h-8 rounded-full px-3 text-sm font-medium transition-colors",
            lang === o.v ? "bg-accent text-accent-fg" : "text-muted hover:bg-surface-3 hover:text-text",
          )}
        >
          {o.label}
        </button>
      ))}
      <span className="sr-only" aria-live="polite">
        {lang === "hi" ? "Language set to Hindi" : "Language set to English"}
      </span>
    </div>
  );
}
