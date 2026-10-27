"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, ShieldAlert, Search, TriangleAlert, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { useInvestigation } from "@/context/investigation-context";
import { pick } from "@/lib/i18n";
import { CATEGORY_LABEL, RISK_LABEL } from "@/lib/labels";

function usePopover() {
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
  return [open, setOpen, ref] as const;
}

function SearchBox() {
  const { lang, history, open: openReport } = useInvestigation();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); inputRef.current?.focus(); }
    };
    const onDown = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setFocus(false); };
    window.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => { window.removeEventListener("keydown", onKey); document.removeEventListener("mousedown", onDown); };
  }, []);

  const pages = useMemo(() => [
    { href: "/", t: lang === "hi" ? "जाँच करें" : "Investigate" },
    { href: "/dashboard", t: lang === "hi" ? "डैशबोर्ड" : "Dashboard" },
    { href: "/history", t: lang === "hi" ? "इतिहास" : "History" },
    { href: "/learn", t: lang === "hi" ? "सीखें और बचें (सुझाव)" : "Learn & Protect (safety tips)" },
    { href: "/resources", t: lang === "hi" ? "संसाधन (रिपोर्टिंग)" : "Resources (reporting)" },
    { href: "/settings", t: lang === "hi" ? "सेटिंग्स" : "Settings" },
  ], [lang]);

  const needle = q.trim().toLowerCase();
  const hits = needle
    ? history.filter((h) => h.report.input.displayText.toLowerCase().includes(needle) || h.report.urls.some((u) => u.raw.toLowerCase().includes(needle))).slice(0, 5)
    : [];
  const pageHits = needle ? pages.filter((p) => p.t.toLowerCase().includes(needle)) : [];

  return (
    <div ref={wrap} className="relative hidden w-[300px] md:block xl:w-[360px]">
      <label htmlFor="global-search" className="sr-only">{lang === "hi" ? "खोजें" : "Search"}</label>
      <div className="glass flex h-11 items-center gap-2 rounded-xl border border-line px-3 focus-within:border-accent/60">
        <Search aria-hidden className="h-4 w-4 text-muted" />
        <input
          id="global-search" ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setFocus(true)} autoComplete="off"
          placeholder={lang === "hi" ? "जाँच, लिंक या सुझाव खोजें…" : "Search investigations, URLs, or tips…"}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-faint"
        />
        <kbd className="rounded border border-line px-1.5 py-0.5 text-[10px] text-muted">⌘ K</kbd>
      </div>
      {focus && needle && (
        <div className="glass absolute left-0 right-0 z-40 mt-2 rounded-xl border border-line p-1.5 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.7)]">
          {hits.length === 0 && pageHits.length === 0 && <p className="px-3 py-3 text-sm text-muted">{lang === "hi" ? "कोई परिणाम नहीं।" : "No results."}</p>}
          {hits.map((h) => (
            <button key={h.id} type="button" onClick={() => { openReport(h.id); setFocus(false); setQ(""); router.push("/"); }} className="block min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-3">
              <span className="line-clamp-1">{h.report.input.displayText}</span>
              <span className="text-xs text-muted">{pick(RISK_LABEL[h.report.classification.risk], lang)} · {pick(CATEGORY_LABEL[h.report.classification.category], lang)}</span>
            </button>
          ))}
          {pageHits.map((p) => (
            <Link key={p.href} href={p.href} onClick={() => { setFocus(false); setQ(""); }} className="flex min-h-11 items-center rounded-lg px-3 text-sm hover:bg-surface-3">{p.t}</Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Panel({ children, label }: { children: ReactNode; label: string }) {
  return <div role="dialog" aria-label={label} className="glass absolute right-0 z-40 mt-2 w-80 rounded-xl border border-line p-4 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.7)]">{children}</div>;
}

function Notifications() {
  const { health, healthChecked, lang } = useInvestigation();
  const [isOpen, setOpen, popRef] = usePopover();
  const notices: Array<{ kind: "error" | "warn"; text: string }> = [];
  if (healthChecked && !health) notices.push({ kind: "error", text: lang === "hi" ? "TrustLens बैकएंड तक नहीं पहुँचा जा सका। जाँच काम नहीं करेगी।" : "Can't reach the TrustLens backend. Investigations won't work." });
  if (health?.ai === "missing_key") notices.push({ kind: "warn", text: lang === "hi" ? "AI विश्लेषण बंद है (API कुंजी नहीं)। केवल नियम-आधारित जाँच।" : "AI analysis is off (no API key). Rule-based checks only." });
  if (health && health.screenshot === "disabled") notices.push({ kind: "warn", text: lang === "hi" ? "स्क्रीनशॉट विश्लेषण चालू नहीं है (कोई विज़न मॉडल नहीं)।" : "Screenshot analysis is disabled (no vision model configured)." });
  return (
    <div ref={popRef} className="relative">
      <button type="button" aria-haspopup="dialog" aria-expanded={isOpen} aria-label={lang === "hi" ? `सूचनाएँ (${notices.length})` : `Notifications (${notices.length})`} onClick={() => setOpen((o) => !o)} className="glass relative grid h-11 w-11 place-items-center rounded-xl border border-line hover:border-accent/50">
        <Bell aria-hidden className="h-5 w-5" />
        {notices.length > 0 && <span aria-hidden className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full bg-high ring-2 ring-bg" />}
      </button>
      {isOpen && (
        <Panel label={lang === "hi" ? "सूचनाएँ" : "Notifications"}>
          <div className="mb-2 text-sm font-semibold">{lang === "hi" ? "सिस्टम सूचनाएँ" : "System notices"}</div>
          {!healthChecked ? <p className="text-sm text-muted">…</p> : notices.length === 0 ? (
            <p className="flex items-center gap-2 text-sm text-muted"><CheckCircle2 aria-hidden className="h-4 w-4 text-low" />{lang === "hi" ? "सब कुछ सामान्य है।" : "Everything is operating normally."}</p>
          ) : (
            <ul className="space-y-2">
              {notices.map((n, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  {n.kind === "error" ? <ShieldAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-high" /> : <TriangleAlert aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-medium" />}
                  <span className="text-[#cbd5e1]">{n.text}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  );
}

function Account() {
  const { lang, history } = useInvestigation();
  const [isOpen, setOpen, popRef] = usePopover();
  return (
    <div ref={popRef} className="relative">
      <button type="button" aria-haspopup="dialog" aria-expanded={isOpen} aria-label={lang === "hi" ? "सत्र जानकारी" : "Session info"} onClick={() => setOpen((o) => !o)} className="grid h-11 w-11 place-items-center rounded-full border border-accent/50 bg-accent/10 hover:bg-accent/20">
        <UserRound aria-hidden className="h-5 w-5 text-accent" />
      </button>
      {isOpen && (
        <Panel label={lang === "hi" ? "सत्र जानकारी" : "Session info"}>
          <div className="text-sm font-semibold">{lang === "hi" ? "अतिथि सत्र" : "Guest session"}</div>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            {lang === "hi" ? "कोई खाता नहीं है और आपकी सामग्री कहीं सहेजी नहीं जाती। इस सत्र में " : "There are no accounts and your content is never stored. This session has "}
            <span className="text-text">{history.length}</span>
            {lang === "hi" ? " जाँच हैं, जो रीफ़्रेश पर मिट जाती हैं।" : history.length === 1 ? " investigation, cleared on refresh." : " investigations, cleared on refresh."}
          </p>
          <Link href="/settings" onClick={() => setOpen(false)} className="mt-3 inline-flex min-h-9 items-center text-sm text-accent hover:underline">{lang === "hi" ? "सेटिंग्स खोलें →" : "Open settings →"}</Link>
        </Panel>
      )}
    </div>
  );
}

export function TopBar() {
  return (
    <div className="no-print absolute right-4 top-[112px] z-30 flex items-center gap-3 lg:right-8 lg:top-5">
      <SearchBox />
      <Notifications />
      <LanguageSwitcher />
      <Account />
    </div>
  );
}
