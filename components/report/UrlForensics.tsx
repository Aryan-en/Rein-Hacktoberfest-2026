"use client";

import { Check, Copy, Link2 } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { defang } from "@/lib/export";
import { pick } from "@/lib/i18n";
import type { Lang, Severity, UrlAnalysis } from "@/lib/types";

const SEV: Record<Severity, string> = { strong: "text-high border-high/40", weak: "text-medium border-medium/40", info: "text-blue border-blue/40" };

function Copyable({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={() => { void navigator.clipboard?.writeText(value); setDone(true); setTimeout(() => setDone(false), 1200); }}
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-line px-2.5 text-xs text-muted hover:text-text"
    >
      {done ? <Check aria-hidden className="h-3.5 w-3.5 text-low" /> : <Copy aria-hidden className="h-3.5 w-3.5" />} {label}
    </button>
  );
}

function Card({ u, lang }: { u: UrlAnalysis; lang: Lang }) {
  const p = u.parsed;
  const facts: Array<[string, string]> = p
    ? [
        [lang === "hi" ? "प्रोटोकॉल" : "Protocol", p.protocol.replace(":", "")],
        [lang === "hi" ? "पोर्ट" : "Port", p.port ?? (lang === "hi" ? "डिफ़ॉल्ट" : "default")],
        [lang === "hi" ? "'@' उपयोगकर्ता-जानकारी" : "'@' userinfo", p.hasUserinfo ? (lang === "hi" ? "हाँ" : "yes") : lang === "hi" ? "नहीं" : "no"],
        [lang === "hi" ? "IP पता" : "IP host", p.isIp ? (lang === "hi" ? "हाँ" : "yes") : lang === "hi" ? "नहीं" : "no"],
        [lang === "hi" ? "यूनिकोड होस्ट" : "Unicode host", p.unicodeHostname],
        [lang === "hi" ? "लेबल संख्या" : "Labels", String(p.labelCount)],
      ]
    : [];
  return (
    <div className="rounded-xl border border-line bg-bg/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Link2 aria-hidden className="h-4 w-4 shrink-0 text-accent" />
        {/* Defanged, inert text: never an anchor to the analyzed URL. */}
        <code className="min-w-0 flex-1 break-all font-mono text-[13px] text-[#cbd5e1]">{defang(u.raw)}</code>
        <Copyable value={u.raw} label={lang === "hi" ? "मूल कॉपी" : "Copy raw"} />
        <Copyable value={defang(u.raw)} label={lang === "hi" ? "सुरक्षित कॉपी" : "Copy defanged"} />
      </div>
      {p && !p.isIp && (
        <div className="mt-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted">{lang === "hi" ? "होस्ट का विभाजन" : "Host breakdown"}</div>
          <div className="mt-2 flex flex-wrap items-stretch gap-1 font-mono text-[13px]">
            {p.subdomain && <span className="rounded-lg border border-line bg-surface-2 px-3 py-2"><span className="block text-[10px] uppercase text-muted">{lang === "hi" ? "सबडोमेन" : "subdomain"}</span>{p.subdomain}</span>}
            <span className="rounded-lg border border-accent/50 bg-accent/10 px-3 py-2"><span className="block text-[10px] uppercase text-accent">{lang === "hi" ? "मुख्य डोमेन (असली साइट)" : "registrable domain (the real site)"}</span>{p.registrableDomain ?? p.hostname}</span>
          </div>
        </div>
      )}
      {facts.length > 0 && (
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {facts.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 border-b border-line/60 py-1">
              <dt className="text-muted">{k}</dt>
              <dd className="break-all text-right font-mono text-[13px]">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <ul className="mt-4 space-y-2">
        {u.signals.length === 0 && p && <li className="text-sm text-muted">{lang === "hi" ? "इस लिंक की बनावट में कोई स्पष्ट खतरे का संकेत नहीं मिला। इसका मतलब यह नहीं कि साइट सुरक्षित है।" : "No structural red flags found in this link. This does not confirm the site is safe."}</li>}
        {u.signals.map((s, i) => (
          <li key={i} className="text-sm">
            <span className={cn("mr-2 rounded border px-1.5 py-0.5 text-[11px]", SEV[s.severity])}>{s.severity === "strong" ? (lang === "hi" ? "मज़बूत" : "strong") : s.severity === "weak" ? (lang === "hi" ? "चेतावनी" : "warning") : lang === "hi" ? "टिप्पणी" : "note"}</span>
            <span className="font-medium">{pick(s.title, lang)}</span>
            <p className="mt-1 text-muted">{pick(s.detail, lang)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function UrlForensics({ urls, lang }: { urls: UrlAnalysis[]; lang: Lang }) {
  if (urls.length === 0) return null;
  return (
    <section aria-label={lang === "hi" ? "लिंक फ़ोरेंसिक्स" : "URL forensics"} className="card animate-fade-up p-5">
      <h3 className="font-semibold">{lang === "hi" ? "लिंक फ़ोरेंसिक्स" : "URL forensics"}</h3>
      <div className="mt-3 space-y-3">{urls.map((u, i) => <Card key={i} u={u} lang={lang} />)}</div>
      <p className="mt-3 text-xs text-muted">{lang === "hi" ? "TrustLens ने इस लिंक को नहीं खोला।" : "TrustLens did not visit this link."}</p>
    </section>
  );
}
