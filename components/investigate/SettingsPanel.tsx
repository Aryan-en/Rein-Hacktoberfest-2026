"use client";

import { useInvestigation } from "@/context/investigation-context";
import { API_BASE } from "@/lib/api";
import { ui } from "@/lib/i18n";
import type { Lang } from "@/lib/types";

export function SettingsPanel() {
  const { lang, setLang, history, clearHistory, health, healthChecked } = useInvestigation();
  const row = (k: string, v: string) => (
    <div key={k} className="flex justify-between gap-4 border-b border-line/60 py-2 text-sm"><dt className="text-muted">{k}</dt><dd className="break-all text-right font-mono text-[13px]">{v}</dd></div>
  );
  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold">{ui("navSettings", lang)}</h1>
      <section className="card mt-8 p-5">
        <h2 className="font-semibold">{lang === "hi" ? "भाषा" : "Language"}</h2>
        <div role="radiogroup" aria-label="Language" className="mt-3 flex gap-2">
          {([["en", "English"], ["hi", "हिन्दी"]] as Array<[Lang, string]>).map(([v, l]) => (
            <button key={v} role="radio" aria-checked={lang === v} onClick={() => setLang(v)} className={`min-h-11 rounded-xl border px-5 text-sm ${lang === v ? "border-accent bg-accent/15 text-accent" : "border-line text-muted hover:text-text"}`}>{l}</button>
          ))}
        </div>
      </section>
      <section className="card mt-4 p-5">
        <h2 className="font-semibold">{lang === "hi" ? "सत्र डेटा" : "Session data"}</h2>
        <p className="mt-1 text-sm text-muted">{lang === "hi" ? "जाँचें केवल इस ब्राउज़र टैब की मेमोरी में रहती हैं।" : "Investigations live only in this browser tab's memory."}</p>
        <button type="button" disabled={history.length === 0} onClick={clearHistory} className="mt-3 min-h-11 rounded-xl border border-high/40 px-5 text-sm text-high hover:bg-high/10 disabled:cursor-not-allowed disabled:opacity-40">
          {lang === "hi" ? `इतिहास साफ़ करें (${history.length})` : `Clear session history (${history.length})`}
        </button>
      </section>
      <section className="card mt-4 p-5">
        <h2 className="font-semibold">{lang === "hi" ? "बैकएंड" : "Backend"}</h2>
        <dl className="mt-2">
          {row("API", API_BASE || "/api (proxied to backend)")}
          {row(lang === "hi" ? "स्थिति" : "Status", !healthChecked ? "…" : health ? "online" : "unreachable")}
          {health && row(lang === "hi" ? "संस्करण" : "Version", health.version)}
          {health && row("AI", health.ai === "configured" ? (lang === "hi" ? "चालू" : "configured") : lang === "hi" ? "बंद (कुंजी नहीं)" : "off (no key)")}
          {health && row(lang === "hi" ? "मॉडल" : "Models", [health.models.primary, health.models.fallback].filter(Boolean).join(", "))}
          {health && row(lang === "hi" ? "स्क्रीनशॉट" : "Screenshot", health.screenshot)}
        </dl>
      </section>
    </div>
  );
}
