"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, BarChart3, FileText, Globe2, History, LayoutDashboard, Lightbulb, ListChecks, Search, Settings, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { Gauge } from "@/components/dashboard/charts";
import { GithubMark } from "@/components/common/GithubMark";
import { TopBarControls } from "./TopBar";
import { useInvestigation } from "@/context/investigation-context";
import { cn } from "@/lib/cn";
import { ui, type UiKey } from "@/lib/i18n";
import { Logo } from "./Logo";

const NAV: Array<{ href: string; key: UiKey; icon: LucideIcon }> = [
  { href: "/dashboard", key: "navDashboard", icon: LayoutDashboard },
  { href: "/investigate", key: "navInvestigate", icon: Search },
  { href: "/history", key: "navHistory", icon: History },
  { href: "/learn", key: "navLearn", icon: ShieldCheck },
  { href: "/resources", key: "navResources", icon: FileText },
  { href: "/settings", key: "navSettings", icon: Settings },
];

function SystemStatus() {
  const { health, healthChecked, lang } = useInvestigation();
  const state = !healthChecked ? "checking" : !health ? "down" : health.ai === "configured" ? "ok" : "rules";
  const dot = state === "ok" ? "bg-low" : state === "rules" ? "bg-medium" : state === "down" ? "bg-high" : "bg-muted";
  const label = state === "ok" ? ui("online", lang) : state === "rules" ? ui("aiOff", lang) : state === "down" ? ui("offline", lang) : "…";
  return (
    <div className="card p-4" aria-live="polite">
      <div className="text-sm font-medium">{ui("systemStatus", lang)}</div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full", dot)} />
          {label}
        </span>
        {health && <span className="text-xs text-muted">v{health.version}</span>}
      </div>
    </div>
  );
}

const GITHUB = "https://github.com/Aryan-en/Rein-Hacktoberfest-2026";


function DashboardExtras() {
  const { lang, history, health } = useInvestigation();
  const flagged = history.filter((h) => h.report.classification.risk === "high" || h.report.classification.risk === "medium").length;
  const subs: Array<{ href: string; label: string; icon: LucideIcon; badge?: number }> = [
    { href: "#alerts", label: lang === "hi" ? "चेतावनियाँ" : "Alerts", icon: Bell, ...(flagged > 0 ? { badge: flagged } : {}) },
    { href: "#trends", label: lang === "hi" ? "स्कैम रुझान" : "Scam Trends", icon: BarChart3 },
    { href: "#map", label: lang === "hi" ? "खतरा मानचित्र" : "Threat Map", icon: Globe2 },
    { href: "#detections", label: lang === "hi" ? "हाल की पहचान" : "Recent Detections", icon: ListChecks },
    { href: "#insights", label: lang === "hi" ? "इनसाइट्स" : "Insights", icon: Sparkles },
  ];
  return (
    <>
      <ul aria-label="Dashboard sections" className="-mt-2 ml-3 flex flex-col gap-0.5 border-l border-line pl-3">
        {subs.map(({ href, label, icon: Icon, badge }) => (
          <li key={href}>
            <a href={href} className="flex min-h-9 items-center gap-2.5 rounded-lg px-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text">
              <Icon aria-hidden className="h-4 w-4" />
              <span className="flex-1">{label}</span>
              {badge !== undefined && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-high px-1 text-[11px] font-semibold text-white">{badge}</span>}
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-auto flex flex-col gap-3">
        <div className="card p-4 text-center">
          <div className="text-sm font-medium">{lang === "hi" ? "सत्र सुरक्षा" : "Session Protection"}</div>
          <div className="mt-2"><Gauge value={history.length} flagged={flagged} label={lang === "hi" ? "जाँचें" : "investigations"} /></div>
          <div className="mt-1 text-xs text-muted">{lang === "hi" ? `इस सत्र में जाँचे गए (${flagged} चिह्नित)` : `Analyzed this session (${flagged} flagged)`}</div>
        </div>
        <div className="card flex items-center justify-between p-4">
          <div>
            <div className="text-sm font-semibold">TrustLens <span className="text-accent">AI</span></div>
            <div className="mt-0.5 text-xs text-muted">v{health?.version ?? "0.1.0"} · Open Source</div>
          </div>
          <a href={GITHUB} target="_blank" rel="noopener noreferrer" aria-label="TrustLens on GitHub" className="grid h-11 w-11 place-items-center rounded-lg text-text hover:bg-surface-3"><GithubMark /></a>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { lang } = useInvestigation();
  return (
    <aside className="no-print fixed inset-y-0 left-0 z-20 hidden w-60 flex-col gap-6 border-r border-line/70 bg-bg/60 p-5 backdrop-blur lg:flex">
      <Link href="/" aria-label="TrustLens AI home" className="block pt-1">
        <Logo tagline={ui("tagline", lang)} />
      </Link>
      <nav aria-label="Primary" className="flex flex-col gap-1.5">
        {NAV.map(({ href, key, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl border px-4 text-[15px] transition-colors",
                active ? "border-accent/40 bg-accent/10 text-text" : "border-transparent text-muted hover:bg-surface-2 hover:text-text",
              )}
            >
              <Icon aria-hidden className={cn("h-5 w-5", active && "text-accent")} />
              {ui(key, lang)}
            </Link>
          );
        })}
      </nav>
      {pathname === "/dashboard" ? <DashboardExtras /> : (
        <>
      <svg aria-hidden viewBox="0 0 200 90" className="mt-auto h-20 w-full opacity-80">
        <defs><linearGradient id="mt" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2dd4bf" stopOpacity="0.45" /><stop offset="1" stopColor="#2dd4bf" stopOpacity="0" /></linearGradient></defs>
        <path d="M0 90 L0 70 L22 62 L40 66 L62 38 L78 50 L98 14 L116 44 L134 30 L152 52 L172 40 L200 58 L200 90 Z" fill="url(#mt)" />
        <path d="M0 70 L22 62 L40 66 L62 38 L78 50 L98 14 L116 44 L134 30 L152 52 L172 40 L200 58" fill="none" stroke="#2dd4bf" strokeWidth="1.5" />
      </svg>
      <div className="flex flex-col gap-3">
        <div className="card p-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Lightbulb aria-hidden className="h-4 w-4 text-accent" />
            {lang === "hi" ? "ऑनलाइन सुरक्षित रहें" : "Stay Safer Online"}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted">
            {lang === "hi"
              ? "TrustLens सबूत दिखाता है ताकि आप खुद फ़ैसला कर सकें। यह प्रमाण नहीं, संकेत देता है।"
              : "TrustLens shows its evidence so you can decide. It gives indicators, not proof."}
          </p>
        </div>
        <SystemStatus />
      </div>
        </>
      )}
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { lang } = useInvestigation();
  return (
    <header className="no-print glass sticky top-0 z-20 border-b border-line lg:hidden">
      <div className="flex items-center justify-between gap-2 px-4 pt-2.5">
        <Link href="/" aria-label="TrustLens AI home" className="inline-block">
          <span className="text-lg font-bold">
            TrustLens <span className="text-accent">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-2"><TopBarControls /></div>
      </div>
      <nav aria-label="Primary" className="flex px-2 pb-1 pt-1">
        {NAV.map(({ href, key, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
            aria-label={ui(key, lang)}
            className={cn("grid h-11 min-w-0 flex-1 place-items-center rounded-lg", pathname === href ? "bg-accent/15 text-accent" : "text-muted")}
          >
            <Icon aria-hidden className="h-5 w-5" />
          </Link>
        ))}
      </nav>
    </header>
  );
}
