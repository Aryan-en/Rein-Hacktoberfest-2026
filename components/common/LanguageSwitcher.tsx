"use client";

import { Check, ChevronDown, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInvestigation } from "@/context/investigation-context";
import type { Lang } from "@/lib/types";

const OPTIONS: Array<{ v: Lang; short: string; label: string }> = [
  { v: "en", short: "EN", label: "English" },
  { v: "hi", short: "हिन्दी", label: "हिन्दी (Hindi)" },
];

export function LanguageSwitcher() {
  const { lang, setLang } = useInvestigation();
  const [open, setOpen] = useState(false);
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
  const cur = OPTIONS.find((o) => o.v === lang)!;
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-haspopup="menu" aria-expanded={open} aria-label="Language" onClick={() => setOpen((o) => !o)} className="glass inline-flex h-11 items-center gap-2 rounded-xl border border-line px-3 text-sm hover:border-accent/50">
        <Languages aria-hidden className="h-4 w-4 text-muted" /> {cur.short} <ChevronDown aria-hidden className="h-4 w-4 text-muted" />
      </button>
      {open && (
        <div role="menu" className="border-line-strong bg-[#101b2d] absolute right-0 z-40 mt-2 w-48 rounded-xl border border-line p-1.5 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.7)]">
          {OPTIONS.map((o) => (
            <button key={o.v} role="menuitemradio" aria-checked={lang === o.v} type="button" onClick={() => { setLang(o.v); setOpen(false); }} className="flex min-h-11 w-full items-center justify-between rounded-lg px-3 text-sm hover:bg-surface-3">
              {o.label} {lang === o.v && <Check aria-hidden className="h-4 w-4 text-accent" />}
            </button>
          ))}
        </div>
      )}
      <span className="sr-only" aria-live="polite">{lang === "hi" ? "Language set to Hindi" : "Language set to English"}</span>
    </div>
  );
}
