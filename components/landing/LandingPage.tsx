"use client";

import Link from "next/link";
import { ArrowRight, Check, CheckCircle2, ChevronDown, Eye, FileSearch, Globe2, ImageUp, Languages, Link2, Lock, Menu, Scale, ShieldAlert, ShieldCheck, Sparkles, X, XCircle, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { GithubMark } from "@/components/common/GithubMark";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { HeroArt } from "@/components/investigate/HeroArt";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/context/auth-context";
import { useInvestigation } from "@/context/investigation-context";
import { cn } from "@/lib/cn";
import { pick } from "@/lib/i18n";
import { COMPARE, EVIDENCE, FAQ, FEATURES, HERO, NAV, STEPS, TRUST_STRIP } from "./content";

const GITHUB = "https://github.com/Aryan-en/Rein-Hacktoberfest-2026";
const ICONS: Record<string, LucideIcon> = { evidence: FileSearch, link: Link2, scale: Scale, image: ImageUp, lang: Languages, lock: Lock };

function Nav() {
  const { lang } = useInvestigation();
  const { status, user } = useAuth();
  const [open, setOpen] = useState(false);
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  return (
    <header className="glass sticky top-0 z-30 border-b border-line">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="TrustLens AI home"><Logo /></Link>
        <nav aria-label="Primary" className="ml-6 hidden items-center gap-1 lg:flex">
          {NAV.map((n) => <a key={n.href} href={n.href} className="rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-text">{pick(n.label, lang)}</a>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block"><LanguageSwitcher /></div>
          {status === "authed" && user ? (
            <Link href="/account" className="hidden min-h-11 items-center rounded-xl border border-line-strong px-4 text-sm hover:border-accent/50 sm:inline-flex">{user.name}</Link>
          ) : (
            <Link href="/auth" className="hidden min-h-11 items-center rounded-xl border border-line-strong px-4 text-sm hover:border-accent/50 sm:inline-flex">{t("Sign in", "साइन इन")}</Link>
          )}
          <Link href="/investigate" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-gradient-to-r from-accent to-[#22d3ee] px-4 text-sm font-semibold text-accent-fg shadow-[0_8px_24px_-10px_rgba(45,212,191,0.8)] hover:brightness-110">
            <span className="hidden sm:inline">{pick(HERO.cta, lang)}</span><span className="sm:hidden">{t("Start", "शुरू")}</span><ArrowRight aria-hidden className="h-4 w-4" />
          </Link>
          <button type="button" aria-label={open ? t("Close menu", "मेनू बंद करें") : t("Open menu", "मेनू खोलें")} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="grid h-11 w-11 place-items-center rounded-xl border border-line lg:hidden">{open ? <X aria-hidden className="h-5 w-5" /> : <Menu aria-hidden className="h-5 w-5" />}</button>
        </div>
      </div>
      {open && (
        <div className="animate-fade-up border-t border-line px-4 pb-4 pt-2 lg:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {NAV.map((n) => <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-lg px-3 text-[15px] text-[#cbd5e1] hover:bg-surface-2">{pick(n.label, lang)}</a>)}
            <Link href="/auth" onClick={() => setOpen(false)} className="flex min-h-12 items-center rounded-lg px-3 text-[15px] text-[#cbd5e1] hover:bg-surface-2">{status === "authed" ? t("Account", "खाता") : t("Sign in", "साइन इन")}</Link>
          </nav>
          <div className="mt-2"><LanguageSwitcher /></div>
        </div>
      )}
    </header>
  );
}

function Hero() {
  const { lang } = useInvestigation();
  return (
    <section className="relative isolate overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_75%_30%,rgba(45,212,191,0.12),transparent_70%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-24 lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1.5 text-xs font-medium text-accent"><Sparkles aria-hidden className="h-3.5 w-3.5" />{pick(HERO.badge, lang)}</span>
          <h1 className="mt-5 text-[clamp(2.2rem,5.2vw,3.9rem)] font-bold leading-[1.07] tracking-tight">
            {lang === "hi" ? (<><span className="text-accent">खतरे को समझें।</span> सबूत जाँचें। <span className="text-high">सुरक्षित</span> रहें।</>) : (<>Understand the <span className="text-high">threat</span>. Verify the <span className="text-accent">evidence</span>. Stay protected.</>)}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-[#cbd5e1]">{pick(HERO.sub, lang)}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/investigate" className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-[#22d3ee] px-7 text-base font-semibold text-accent-fg shadow-[0_14px_40px_-14px_rgba(45,212,191,0.9)] hover:brightness-110">{pick(HERO.cta, lang)}<ArrowRight aria-hidden className="h-5 w-5" /></Link>
            <a href="#sample" className="inline-flex min-h-14 items-center rounded-xl border border-line-strong bg-surface-2/60 px-6 text-base hover:border-accent/50">{pick(HERO.cta2, lang)}</a>
          </div>
          <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {HERO.points.map((p) => <li key={p.en} className="flex items-center gap-2"><Check aria-hidden className="h-4 w-4 text-accent" />{pick(p, lang)}</li>)}
          </ul>
        </div>
        <div aria-hidden className="relative hidden h-[330px] lg:block"><HeroArt /></div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const { lang } = useInvestigation();
  return (
    <section aria-label="Highlights" className="border-y border-line bg-surface/40">
      <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 lg:grid-cols-4">
        {TRUST_STRIP.map((x) => (
          <li key={x.t.en} className="flex items-start gap-3"><ShieldCheck aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-accent" /><div><div className="text-sm font-semibold">{pick(x.t, lang)}</div><div className="text-xs text-muted">{pick(x.d, lang)}</div></div></li>
        ))}
      </ul>
    </section>
  );
}

function SectionHead({ id, eyebrow, title, sub }: { id?: string; eyebrow: string; title: string; sub?: string }) {
  return (
    <div id={id} className="mx-auto max-w-2xl scroll-mt-24 text-center">
      <div className="text-xs font-semibold uppercase tracking-widest text-accent">{eyebrow}</div>
      <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {sub && <p className="mt-3 text-muted">{sub}</p>}
    </div>
  );
}

function Features() {
  const { lang } = useInvestigation();
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHead id="features" eyebrow={t("Features", "सुविधाएँ")} title={t("Built to show its work", "अपना काम दिखाने के लिए बना")} sub={t("An investigation tool, not a black-box score.", "जाँच का औज़ार, किसी अनजान स्कोर का डिब्बा नहीं।")} />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => {
          const I = ICONS[f.icon] ?? Globe2;
          return (
            <li key={f.t.en} className="card p-6 transition-colors hover:border-accent/40">
              <span className="grid h-12 w-12 place-items-center rounded-xl border border-accent/30 bg-accent/10"><I aria-hidden className="h-6 w-6 text-accent" /></span>
              <h3 className="mt-4 text-lg font-semibold">{pick(f.t, lang)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{pick(f.d, lang)}</p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function How() {
  const { lang } = useInvestigation();
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  return (
    <section className="border-y border-line bg-surface/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead id="how" eyebrow={t("How it works", "यह कैसे काम करता है")} title={t("From suspicious to explained in four steps", "संदिग्ध से समझाए गए तक, चार कदमों में")} />
        <ol className="mt-12 grid gap-4 md:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.t.en} className="card relative p-6">
              <span className="grid h-9 w-9 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-sm font-bold text-accent">{i + 1}</span>
              <h3 className="mt-4 font-semibold">{pick(s.t, lang)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{pick(s.d, lang)}</p>
              {i < STEPS.length - 1 && <ArrowRight aria-hidden className="absolute -right-3.5 top-1/2 z-10 hidden h-5 w-5 -translate-y-1/2 text-accent md:block" />}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function EvidenceModel() {
  const { lang } = useInvestigation();
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  return (
    <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
      <SectionHead id="trust" eyebrow={t("Evidence model", "सबूत का मॉडल")} title={t("Evidence you can trust, and evidence you shouldn't", "सबूत जिन पर भरोसा करें, और जिन पर नहीं")} sub={t("TrustLens never blurs what it saw with what a model thinks.", "TrustLens कभी यह नहीं मिलाता कि उसने क्या देखा और मॉडल क्या सोचता है।")} />
      <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {EVIDENCE.map((e) => (
          <li key={e.k} className="card p-5">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", e.tone)}><Eye aria-hidden className="h-3.5 w-3.5" />{pick(e.t, lang)}</span>
            <p className="mt-3 text-sm leading-relaxed text-muted">{pick(e.d, lang)}</p>
          </li>
        ))}
      </ul>
      <div className="card mx-auto mt-8 max-w-3xl border-accent/30 bg-accent/5 p-5 text-center text-sm leading-relaxed text-[#cbd5e1]">
        {t("The AI can never lower the rule-based risk, and can't reach High without a quote that really exists in your text.", "AI नियम-आधारित जोखिम को कभी कम नहीं कर सकता, और आपके टेक्स्ट में सचमुच मौजूद उद्धरण के बिना उच्च तक नहीं पहुँच सकता।")}
      </div>
    </section>
  );
}

/** Static, clearly labelled synthetic illustration of the report layout. Not a live result. */
function Sample() {
  const { lang } = useInvestigation();
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  return (
    <section className="border-y border-line bg-surface/40 py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHead id="sample" eyebrow={t("Sample report", "नमूना रिपोर्ट")} title={t("What an investigation looks like", "एक जाँच कैसी दिखती है")} sub={t("A synthetic example to show the layout. Run your own to see a real report.", "लेआउट दिखाने के लिए एक कृत्रिम उदाहरण। असली रिपोर्ट के लिए अपनी जाँच चलाएँ।")} />
        <div className="relative mx-auto mt-12 max-w-4xl">
          <span className="absolute -top-3 right-4 z-10 rounded-full border border-medium/40 bg-bg px-3 py-1 text-[11px] font-semibold tracking-wide text-medium">{t("SAMPLE (SYNTHETIC)", "नमूना (कृत्रिम)")}</span>
          <div className="card grid gap-5 border-high/40 p-5 shadow-[0_12px_40px_-20px_rgba(239,68,68,0.55)] sm:p-7 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="grid h-14 w-14 place-items-center rounded-2xl border border-high/40 bg-high/10"><ShieldAlert aria-hidden className="h-7 w-7 text-high" /></span>
                <div><div className="text-xs font-semibold uppercase tracking-wider text-high">{t("High risk", "उच्च जोखिम")}</div><div className="text-xl font-semibold">{t("Likely phishing / credential theft", "फ़िशिंग / क्रेडेंशियल चोरी की संभावना")}</div></div>
              </div>
              <p className="mt-4 rounded-xl border border-line bg-bg/50 p-4 text-[15px] leading-8">
                SBI KYC expired! Update <mark className="rounded bg-medium/20 px-0.5 underline decoration-medium decoration-dotted underline-offset-4">within 24 hrs</mark>: <mark className="rounded bg-high/25 px-0.5 underline decoration-high decoration-2 underline-offset-4">http://sbi-kyc-verify.top/login</mark> or your account will be blocked. <mark className="rounded bg-high/25 px-0.5 underline decoration-high decoration-2 underline-offset-4">Share OTP</mark> to verify.
              </p>
              <p className="mt-3 text-xs text-muted">{t("Highlights link to the evidence behind them.", "हर रंगीन अंश के पीछे का सबूत देखा जा सकता है।")}</p>
            </div>
            <ul className="space-y-2.5 text-sm">
              {[
                ["strong", t("Asks for a secret credential (OTP)", "गोपनीय जानकारी (OTP) माँगी गई"), t("Heuristic indicator", "अनुमान-आधारित संकेत")],
                ["strong", t("Brand name on an unofficial domain", "अनधिकृत डोमेन पर ब्रांड का नाम"), t("Heuristic indicator", "अनुमान-आधारित संकेत")],
                ["weak", t("Urgency or deadline pressure", "जल्दबाज़ी या समय-सीमा का दबाव"), t("Heuristic indicator", "अनुमान-आधारित संकेत")],
                ["weak", t("Link is not encrypted (http)", "लिंक एन्क्रिप्टेड नहीं (http)"), t("Observed", "देखा गया")],
              ].map(([sev, title, prov]) => (
                <li key={title} className="rounded-xl border border-line bg-bg/40 p-3.5">
                  <div className="font-medium">{title}</div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className={cn("rounded border px-1.5 py-0.5", sev === "strong" ? "border-high/40 text-high" : "border-medium/40 text-medium")}>{sev === "strong" ? t("Strong indicator", "मज़बूत संकेत") : t("Warning sign", "चेतावनी संकेत")}</span>
                    <span className="rounded border border-line-strong px-1.5 py-0.5 text-muted">{prov}</span>
                    <span className="inline-flex items-center gap-1 text-low"><CheckCircle2 aria-hidden className="h-3 w-3" />{t("Quote found", "उद्धरण मिला")}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 text-center">
            <Link href="/investigate?demo=bank-kyc" className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-5 font-medium text-accent hover:bg-accent/20">{t("Try this example yourself", "यह उदाहरण खुद आज़माएँ")}<ArrowRight aria-hidden className="h-4 w-4" /></Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Compare() {
  const { lang } = useInvestigation();
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  return (
    <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
      <SectionHead eyebrow={t("Why it's different", "यह अलग क्यों है")} title={t("Not another scam-percentage generator", "एक और स्कैम-प्रतिशत जनरेटर नहीं")} />
      <div className="card mt-10 overflow-hidden">
        <div className="grid grid-cols-2 border-b border-line bg-surface-2/60 text-sm font-semibold">
          <div className="px-5 py-3 text-muted">{t("Typical scam checker", "आम स्कैम चेकर")}</div>
          <div className="px-5 py-3 text-accent">TrustLens</div>
        </div>
        <ul>
          {COMPARE.map((r) => (
            <li key={r.a.en} className="grid grid-cols-2 border-b border-line/60 text-sm last:border-0">
              <div className="flex items-start gap-2.5 px-5 py-3.5 text-muted"><XCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-high/70" />{pick(r.a, lang)}</div>
              <div className="flex items-start gap-2.5 px-5 py-3.5"><CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-accent" />{pick(r.b, lang)}</div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Faq() {
  const { lang } = useInvestigation();
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  return (
    <section className="border-t border-line bg-surface/40 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <SectionHead id="faq" eyebrow="FAQ" title={t("Questions, answered plainly", "सवाल, सीधे जवाब")} />
        <ul className="mt-10 space-y-3">
          {FAQ.map((f) => (
            <li key={f.q.en}>
              <details className="card group">
                <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-medium">{pick(f.q, lang)}<ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" /></summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{pick(f.a, lang)}</p>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function FinalCta() {
  const { lang } = useInvestigation();
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  return (
    <section className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
      <div className="card relative overflow-hidden border-accent/30 p-10 sm:p-14">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_80%_at_50%_0%,rgba(45,212,191,0.16),transparent_70%)]" />
        <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">{t("Got a message that feels off?", "कोई संदेश अजीब लग रहा है?")}</h2>
        <p className="relative mx-auto mt-3 max-w-lg text-muted">{t("Check it in seconds. No sign-up, nothing stored, and you'll see exactly why.", "सेकंडों में जाँचें। साइन-अप नहीं, कुछ सहेजा नहीं जाता, और आप ठीक-ठीक कारण देखेंगे।")}</p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/investigate" className="inline-flex min-h-14 items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-[#22d3ee] px-7 text-base font-semibold text-accent-fg hover:brightness-110">{pick(HERO.cta, lang)}<ArrowRight aria-hidden className="h-5 w-5" /></Link>
          <Link href="/auth?mode=signup" className="inline-flex min-h-14 items-center rounded-xl border border-line-strong bg-surface-2/60 px-6 text-base hover:border-accent/50">{t("Create a free account", "मुफ़्त खाता बनाएँ")}</Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { lang } = useInvestigation();
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  return (
    <footer className="border-t border-line bg-bg/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo tagline={t("Understand the Threat. Verify the Evidence.", "खतरे को समझें। सबूत जाँचें।")} />
          <p className="mt-4 max-w-sm text-xs leading-relaxed text-muted">{t("TrustLens gives indicators, not proof. It cannot confirm that a link, sender or message is genuine or fraudulent. Built for Hacktoberfest Hack Day Chandigarh 2026.", "TrustLens संकेत देता है, प्रमाण नहीं। वह यह पुष्टि नहीं कर सकता कि कोई लिंक, भेजने वाला या संदेश असली है या धोखा। Hacktoberfest Hack Day चंडीगढ़ 2026 के लिए बना।")}</p>
        </div>
        <nav aria-label="Product" className="text-sm">
          <div className="mb-3 font-semibold">{t("Product", "उत्पाद")}</div>
          <ul className="space-y-2 text-muted">
            <li><Link href="/investigate" className="hover:text-text">{t("Investigate", "जाँच करें")}</Link></li>
            <li><Link href="/dashboard" className="hover:text-text">{t("Dashboard", "डैशबोर्ड")}</Link></li>
            <li><Link href="/learn" className="hover:text-text">{t("Learn & Protect", "सीखें और बचें")}</Link></li>
            <li><Link href="/resources" className="hover:text-text">{t("Resources", "संसाधन")}</Link></li>
          </ul>
        </nav>
        <nav aria-label="Project" className="text-sm">
          <div className="mb-3 font-semibold">{t("Project", "प्रोजेक्ट")}</div>
          <ul className="space-y-2 text-muted">
            <li><a href={GITHUB} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-text"><GithubMark className="h-4 w-4 fill-current" />GitHub</a></li>
            <li><Link href="/auth" className="hover:text-text">{t("Sign in", "साइन इन")}</Link></li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-fg">Skip to content</a>
      <Nav />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero />
        <TrustStrip />
        <Features />
        <How />
        <EvidenceModel />
        <Sample />
        <Compare />
        <Faq />
        <FinalCta />
      </main>
      <Footer />
    </div>
  );
}
