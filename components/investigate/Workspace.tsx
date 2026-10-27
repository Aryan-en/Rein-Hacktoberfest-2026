"use client";

import Link from "next/link";
import { ArrowRight, FileSearch, Globe2, Languages, Lightbulb, ScanSearch, ShieldCheck, Sparkles, type LucideIcon } from "lucide-react";
import { useInvestigation } from "@/context/investigation-context";
import { ui } from "@/lib/i18n";
import { ReportView } from "@/components/report/ReportView";
import { ErrorPanel } from "./ErrorPanel";
import { HeroBanner } from "./HeroBanner";
import { InvestigationInput } from "./InvestigationInput";
import { InvestigationProgress } from "./InvestigationProgress";
import { RecentInvestigation } from "./RecentInvestigation";
import { ThreatIntel } from "./ThreatIntel";

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
          <li key={s.t} className="card relative flex items-start gap-3 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10"><s.icon aria-hidden className="h-5 w-5 text-accent" /></span>
            <div>
              <div className="text-sm font-semibold"><span className="mr-1.5 text-muted">{i + 1}.</span>{s.t}</div>
              <div className="mt-0.5 text-xs leading-relaxed text-muted">{s.d}</div>
            </div>
            {i < steps.length - 1 && <ArrowRight aria-hidden className="absolute -right-[18px] top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-accent sm:block" />}
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

export function Workspace() {
  const { lang, status, report, error, elapsedMs, cooldown, health, healthChecked, submit, reset } = useInvestigation();
  const busy = status === "submitting";
  return (
    <div className="space-y-8">
      <HeroBanner lang={lang} />
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
          <ThreatIntel lang={lang} />
          <section className="card border-accent/30 bg-accent/5 p-5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-semibold"><Lightbulb aria-hidden className="h-4 w-4 text-accent" />{ui("protect", lang)}</h2>
              <Link href="/learn" className="inline-flex items-center gap-1 text-sm text-accent hover:underline">{ui("viewGuide", lang)} <ArrowRight aria-hidden className="h-4 w-4" /></Link>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted">{ui("protectBody", lang)}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
