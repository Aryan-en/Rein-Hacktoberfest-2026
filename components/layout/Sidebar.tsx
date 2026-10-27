"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenCheck, History, Lightbulb, Search, type LucideIcon } from "lucide-react";
import { useInvestigation } from "@/context/investigation-context";
import { cn } from "@/lib/cn";
import { ui, type UiKey } from "@/lib/i18n";
import { Logo } from "./Logo";

const NAV: Array<{ href: string; key: UiKey; icon: LucideIcon }> = [
  { href: "/", key: "navInvestigate", icon: Search },
  { href: "/history", key: "navHistory", icon: History },
  { href: "/learn", key: "navLearn", icon: BookOpenCheck },
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
      <div className="mt-auto flex flex-col gap-3">
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
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  const { lang } = useInvestigation();
  return (
    <header className="no-print glass sticky top-0 z-20 border-b border-line lg:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <Link href="/" aria-label="TrustLens AI home">
          <span className="text-lg font-bold">
            TrustLens <span className="text-accent">AI</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="flex gap-1">
          {NAV.map(({ href, key, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
              aria-label={ui(key, lang)}
              className={cn("grid h-11 w-11 place-items-center rounded-lg", pathname === href ? "bg-accent/15 text-accent" : "text-muted")}
            >
              <Icon aria-hidden className="h-5 w-5" />
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
