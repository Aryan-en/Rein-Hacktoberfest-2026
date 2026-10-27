"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert" className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center text-center">
      <span className="grid h-20 w-20 place-items-center rounded-3xl border border-high/40 bg-high/10"><TriangleAlert aria-hidden className="h-10 w-10 text-high" /></span>
      <h1 className="mt-6 text-3xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-muted">This part of the page failed to display. Your investigations in this session are not lost unless you reload.</p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted">ref: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="min-h-12 rounded-xl bg-gradient-to-r from-accent to-[#22d3ee] px-5 font-semibold text-accent-fg">Try again</button>
        <Link href="/" className="inline-flex min-h-12 items-center rounded-xl border border-line-strong bg-surface-2 px-5 hover:border-accent/50">Go home</Link>
      </div>
    </div>
  );
}
