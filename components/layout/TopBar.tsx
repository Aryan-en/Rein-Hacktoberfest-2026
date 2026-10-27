"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCircle2, ShieldAlert, Search, TriangleAlert, UserRound } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { useAuth } from "@/context/auth-context";
import { useInvestigation } from "@/context/investigation-context";
import { cn } from "@/lib/cn";
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
    { href: "/investigate", t: lang === "hi" ? "जाँच करें" : "Investigate" },
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
        <div className="border-line-strong bg-[#101b2d] absolute left-0 right-0 z-40 mt-2 rounded-xl border border-line p-1.5 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.7)]">
          {hits.length === 0 && pageHits.length === 0 && <p className="px-3 py-3 text-sm text-muted">{lang === "hi" ? "कोई परिणाम नहीं।" : "No results."}</p>}
          {hits.map((h) => (
            <button key={h.id} type="button" onClick={() => { openReport(h.id); setFocus(false); setQ(""); router.push("/investigate"); }} className="block min-h-11 w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-3">
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
  return <div role="dialog" aria-label={label} className="border-line-strong bg-[#101b2d] absolute right-0 z-40 mt-2 w-80 rounded-xl border border-line p-4 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.7)] max-sm:fixed max-sm:inset-x-3 max-sm:top-[108px] max-sm:w-auto">{children}</div>;
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
  const { status, user, signOut } = useAuth();
  const router = useRouter();
  const [isOpen, setOpen, popRef] = usePopover();
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  const link = "inline-flex min-h-9 items-center text-sm text-accent hover:underline";
  return (
    <div ref={popRef} className="relative">
      <button type="button" aria-haspopup="dialog" aria-expanded={isOpen} aria-label={user ? `${t("Account", "खाता")}: ${user.name}` : t("Session info", "सत्र जानकारी")} onClick={() => setOpen((o) => !o)} className={cn("grid h-11 w-11 place-items-center rounded-full border border-accent/50 hover:bg-accent/20", user ? "bg-accent text-accent-fg" : "bg-accent/10")}>
        {user ? <span aria-hidden className="text-sm font-bold">{user.name.slice(0, 1).toUpperCase()}</span> : <UserRound aria-hidden className="h-5 w-5 text-accent" />}
      </button>
      {isOpen && (
        <Panel label={t("Account", "खाता")}>
          {user ? (
            <>
              <div className="truncate text-sm font-semibold">{user.name}</div>
              <div className="truncate text-xs text-muted">{user.email}</div>
              <p className="mt-2 text-xs leading-relaxed text-muted">{t(`${history.length} investigation(s) in this tab. Nothing is stored on the server.`, `इस टैब में ${history.length} जाँच। सर्वर पर कुछ सहेजा नहीं जाता।`)}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                <Link href="/account" onClick={() => setOpen(false)} className={link}>{t("Account", "खाता")}</Link>
                <button type="button" onClick={() => { setOpen(false); window.dispatchEvent(new Event("trustlens:shortcuts")); }} className={link}>{t("Shortcuts", "शॉर्टकट")}</button>
                <button type="button" onClick={() => { setOpen(false); void signOut().then(() => router.push("/")); }} className={link}>{t("Sign out", "साइन आउट")}</button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-semibold">{status === "loading" ? "…" : t("Guest session", "अतिथि सत्र")}</div>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                {t(`Your content is never stored. This session has ${history.length} investigation(s), cleared on refresh. Sign in for a higher request allowance.`, `आपकी सामग्री कभी सहेजी नहीं जाती। इस सत्र में ${history.length} जाँच हैं, जो रीफ़्रेश पर मिट जाती हैं। अधिक अनुरोध सीमा के लिए साइन इन करें।`)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/auth" onClick={() => setOpen(false)} className="inline-flex min-h-10 items-center rounded-lg bg-accent px-4 text-sm font-semibold text-accent-fg">{t("Sign in", "साइन इन")}</Link>
                <Link href="/auth?mode=signup" onClick={() => setOpen(false)} className="inline-flex min-h-10 items-center rounded-lg border border-line-strong px-4 text-sm hover:border-accent/50">{t("Create account", "खाता बनाएँ")}</Link>
              </div>
              <button type="button" onClick={() => { setOpen(false); window.dispatchEvent(new Event("trustlens:shortcuts")); }} className={cn(link, "mt-2")}>{t("Keyboard shortcuts", "कीबोर्ड शॉर्टकट")}</button>
            </>
          )}
        </Panel>
      )}
    </div>
  );
}

export function TopBarControls({ withSearch = false }: { withSearch?: boolean }) {
  return (
    <>
      {withSearch && <SearchBox />}
      <Notifications />
      <LanguageSwitcher />
      <Account />
    </>
  );
}

export function TopBar() {
  return (
    <div className="no-print absolute right-8 top-5 z-30 hidden items-center gap-3 lg:flex">
      <TopBarControls withSearch />
    </div>
  );
}
