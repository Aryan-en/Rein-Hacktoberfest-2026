import Link from "next/link";
import { Compass, LayoutDashboard, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
      <span className="grid h-20 w-20 place-items-center rounded-3xl border border-accent/30 bg-accent/10 shadow-[0_0_40px_-10px_rgba(45,212,191,0.6)]">
        <Compass aria-hidden className="h-10 w-10 text-accent" />
      </span>
      <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-accent">404</p>
      <h1 className="mt-2 text-3xl font-bold">This page could not be found</h1>
      <p className="mt-3 text-muted">The link may be mistyped or the page may have moved. Nothing was analyzed or stored.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-[#22d3ee] px-5 font-semibold text-accent-fg"><Search aria-hidden className="h-4 w-4" /> Start an investigation</Link>
        <Link href="/dashboard" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-line-strong bg-surface-2 px-5 hover:border-accent/50"><LayoutDashboard aria-hidden className="h-4 w-4" /> Dashboard</Link>
      </div>
    </div>
  );
}
