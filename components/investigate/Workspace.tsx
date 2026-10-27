"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, FileSearch, Globe2, Languages, Lightbulb, ScanSearch, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { useInvestigation } from "@/context/investigation-context";
import { pick, ui } from "@/lib/i18n";
import { CATEGORY_LABEL, RISK_LABEL, RISK_STYLE } from "@/lib/labels";
import { cn } from "@/lib/cn";
import { ReportView } from "@/components/report/ReportView";
import { ErrorPanel } from "./ErrorPanel";
import { InvestigationInput } from "./InvestigationInput";
import { InvestigationProgress } from "./InvestigationProgress";

function Hero({ lang }: { lang: "en" | "hi" }) {
  return (
    <header className="max-w-3xl">
      <h1 className="text-[clamp(1.9rem,4.2vw,3rem)] font-bold leading-[1.12] tracking-tight">
        {lang === "hi" ? (
          <>
            <span className="text-high">ठगी</span> पकड़ें। <span className="text-accent">फ़िशिंग</span> बेनकाब करें।
            <br />एक कदम आगे रहें।
          </>
        ) : (
          <>
            Detect <span className="text-high">Scams.</span> Expose <span className="text-accent">Phishing.</span>
            <br />Stay One Step Ahead.
          </>
        )}
      </h1>
      <p className="mt-3 text-base text-muted sm:text-lg">{ui("heroSub", lang)}</p>
    </header>
  );
}

function HowItWorks({ lang }: { lang: "en" | "hi" }) {
  const steps: Array<{ icon: LucideIcon; t: string; d: string }> = [
    { icon: FileSearch, t: lang === "hi" ? "जमा करें" : "Submit", d: lang === "hi" ? "टेक्स्ट, लिंक या स्क्रीनशॉट" : "Text, URL or screenshot" },
    { icon: ShieldCheck, t: lang === "hi" ? "जाँच" : "Investigate", d: lang === "hi" ? "नियम + ओपन-वेट AI, फिर सबूत सत्यापन" : "Rules + open-weight AI, then evidence verification" },
    { icon: ScanSearch, t: lang === "hi" ? "नतीजे" : "Get results", d: lang === "hi" ? "जोखिम, सबूत और सुरक्षा सलाह" : "Risk, evidence and safety advice" },
  ];
  return (
    <section aria-label={ui("howItWorks", lang)}>
      <h2 className="text-xl font-semibold">{ui("howItWorks", lang)}</h2>
      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.t} className="card flex items-start gap-3 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10"><s.icon aria-hidden className="h-5 w-5 text-accent" /></span>
            <div>
              <div className="text-sm font-semibold"><span className="mr-1.5 text-muted">{i + 1}.</span>{s.t}</div>
              <div className="mt-0.5 text-xs leading-relaxed text-muted">{s.d}</div>
            </div>
          </li>
        ))}
      </ol>
      <ul className="card mt-4 grid grid-cols-2 gap-4 p-4 sm:grid-cols-5">
        {[
          { icon: Sparkles, t: lang === "hi" ? "AI विश्लेषण" : "AI-Powered Analysis" },
          { icon: Globe2, t: lang === "hi" ? "लिंक फ़ोरेंसिक्स" : "URL Forensics" },
          { icon: ScanSearch, t: lang === "hi" ? "स्क्रीनशॉट समझ" : "Screenshot Understanding" },
          { icon: Languages, t: lang === "hi" ? "अंग्रेज़ी + हिन्दी" : "English + Hindi" },
          { icon: ShieldCheck, t: lang === "hi" ? "निजता पहले" : "Privacy First" },
        ].map((f) => (
          <li key={f.t} className="flex items-center gap-2.5 text-sm"><f.icon aria-hidden className="h-5 w-5 shrink-0 text-accent" />{f.t}</li>
        ))}
      </ul>
    </section>
  );
}

function RecentInvestigation({ lang }: { lang: "en" | "hi" }) {
  const { history, open } = useInvestigation();
  const latest = history[0];
  return (
    <section aria-label={ui("recent", lang)} className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{ui("recent", lang)}</h2>
        <Link href="/history" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">{ui("viewAll", lang)} <ArrowRight aria-hidden className="h-4 w-4" /></Link>
      </div>
      {!latest ? (
        <p className="mt-4 text-sm leading-relaxed text-muted">{ui("noneYet", lang)}</p>
      ) : (
        <button type="button" onClick={() => open(latest.id)} className="mt-4 block w-full text-left">
          <div className="rounded-xl border border-line bg-bg/40 p-4 hover:border-accent/40">
            <p className="line-clamp-2 text-sm text-[#cbd5e1]">{latest.report.input.displayText || (lang === "hi" ? "(स्क्रीनशॉट)" : "(screenshot)")}</p>
            <div className="mt-3 flex items-center gap-3">
              <span className={cn("grid h-10 w-10 place-items-center rounded-lg border", RISK_STYLE[latest.report.classification.risk].border, RISK_STYLE[latest.report.classification.risk].bg)}>
                <span aria-hidden className={cn("h-3 w-3 rounded-full", RISK_STYLE[latest.report.classification.risk].dot)} />
              </span>
              <div>
                <div className={cn("text-sm font-semibold", RISK_STYLE[latest.report.classification.risk].text)}>{pick(RISK_LABEL[latest.report.classification.risk], lang)}</div>
                <div className="text-xs text-muted">{pick(CATEGORY_LABEL[latest.report.classification.category], lang)}</div>
              </div>
            </div>
          </div>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              [latest.report.evidence.length, ui("evidenceFound", lang)],
              [new Set(latest.report.signals.map((s) => s.id)).size, ui("riskFactors", lang)],
              [latest.report.urls.length, ui("suspiciousUrl", lang)],
            ].map(([n, l]) => (
              <div key={String(l)} className="rounded-lg border border-line bg-surface-2/50 p-2.5">
                <dd className="text-lg font-semibold">{n}</dd>
                <dt className="text-[11px] text-muted">{l}</dt>
              </div>
            ))}
          </dl>
        </button>
      )}
    </section>
  );
}

function WhatWeCheck({ lang }: { lang: "en" | "hi" }) {
  const rows = [
    [lang === "hi" ? "लिंक की बनावट" : "Link structure", lang === "hi" ? "IP होस्ट, नकली/मिलते-जुलते डोमेन, '@' चाल, शॉर्टनर" : "IP hosts, lookalike domains, '@' tricks, shorteners"],
    [lang === "hi" ? "भाषा के पैटर्न" : "Language patterns", lang === "hi" ? "जल्दबाज़ी, OTP माँग, अग्रिम शुल्क, धमकी" : "Urgency, OTP requests, upfront fees, threats"],
    [lang === "hi" ? "AI व्याख्या" : "AI interpretation", lang === "hi" ? "संदर्भ और हेरफेर की तकनीकें" : "Context and manipulation techniques"],
    [lang === "hi" ? "सबूत सत्यापन" : "Evidence verification", lang === "hi" ? "AI के हर उद्धरण को आपके टेक्स्ट से मिलाया जाता है" : "Every AI quote is matched against your text"],
  ];
  return (
    <section aria-label={ui("whatWeCheck", lang)} className="card p-5">
      <h2 className="font-semibold">{ui("whatWeCheck", lang)}</h2>
      <ul className="mt-3 space-y-3">
        {rows.map(([t, d]) => (
          <li key={t} className="text-sm"><div className="font-medium">{t}</div><div className="text-xs leading-relaxed text-muted">{d}</div></li>
        ))}
      </ul>
    </section>
  );
}

export function Workspace() {
  const { lang, status, report, error, elapsedMs, cooldown, health, healthChecked, submit, reset } = useInvestigation();
  const busy = status === "submitting";
  return (
    <div className="space-y-8">
      <Hero lang={lang} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <InvestigationInput lang={lang} busy={busy} cooldown={cooldown} health={health} healthChecked={healthChecked} onSubmit={(r) => void submit(r)} />
          {busy && <InvestigationProgress elapsedMs={elapsedMs} lang={lang} />}
          {status === "error" && error && <ErrorPanel error={error} lang={lang} onDismiss={reset} />}
          {status === "success" && report && !busy && <ReportView report={report} lang={lang} />}
          {status !== "success" && !busy && <HowItWorks lang={lang} />}
        </div>
        <aside className="no-print min-w-0 space-y-6">
          <RecentInvestigation lang={lang} />
          <WhatWeCheck lang={lang} />
          <section className="card border-accent/30 bg-accent/5 p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold"><Lightbulb aria-hidden className="h-4 w-4 text-accent" />{ui("protect", lang)}</h2>
              <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">{ui("viewGuide", lang)} <ArrowRight aria-hidden className="h-4 w-4" /></Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{ui("protectBody", lang)}</p>
            <BookOpenCheck aria-hidden className="sr-only" />
          </section>
        </aside>
      </div>
    </div>
  );
}
