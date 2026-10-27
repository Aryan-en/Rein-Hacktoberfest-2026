"use client";

import { Keyboard, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useInvestigation } from "@/context/investigation-context";

const ROWS: Array<{ keys: string[]; en: string; hi: string }> = [
  { keys: ["⌘ / Ctrl", "K"], en: "Focus search", hi: "खोज पर जाएँ" },
  { keys: ["⌘ / Ctrl", "Enter"], en: "Analyze (in the message box)", hi: "जाँचें (संदेश बॉक्स में)" },
  { keys: ["←", "→"], en: "Switch input tabs (Message / URL / Screenshot)", hi: "इनपुट टैब बदलें (संदेश / लिंक / स्क्रीनशॉट)" },
  { keys: ["Enter", "Space"], en: "Select a map node or open a card", hi: "मानचित्र नोड चुनें या कार्ड खोलें" },
  { keys: ["Esc"], en: "Close menus, dialogs and the map card", hi: "मेनू, डायलॉग और मानचित्र कार्ड बंद करें" },
  { keys: ["?"], en: "Show this help", hi: "यह सहायता दिखाएँ" },
];

export function ShortcutsDialog() {
  const { lang } = useInvestigation();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const show = () => { returnFocus.current = document.activeElement as HTMLElement | null; setOpen(true); };
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing = !!el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable);
      if (e.key === "?" && !typing && !e.metaKey && !e.ctrlKey) { e.preventDefault(); show(); }
      else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("trustlens:shortcuts", show);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("trustlens:shortcuts", show); };
  }, []);

  useEffect(() => {
    if (open) closeRef.current?.focus();
    else returnFocus.current?.focus?.();
  }, [open]);

  if (!open) return null;
  return (
    <div className="no-print fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div role="dialog" aria-modal="true" aria-label={lang === "hi" ? "कीबोर्ड शॉर्टकट" : "Keyboard shortcuts"} className="card animate-fade-up w-full max-w-md p-5">
        <div className="flex items-center gap-2">
          <Keyboard aria-hidden className="h-5 w-5 text-accent" />
          <h2 className="flex-1 text-lg font-semibold">{lang === "hi" ? "कीबोर्ड शॉर्टकट" : "Keyboard shortcuts"}</h2>
          <button ref={closeRef} type="button" aria-label={lang === "hi" ? "बंद करें" : "Close"} onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-3 hover:text-text"><X aria-hidden className="h-5 w-5" /></button>
        </div>
        <dl className="mt-4 divide-y divide-line/60">
          {ROWS.map((r) => (
            <div key={r.en} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <dt className="text-[#cbd5e1]">{lang === "hi" ? r.hi : r.en}</dt>
              <dd className="flex shrink-0 gap-1">{r.keys.map((k) => <kbd key={k} className="rounded-md border border-line-strong bg-surface-2 px-2 py-0.5 text-xs">{k}</kbd>)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
