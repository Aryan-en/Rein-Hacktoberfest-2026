"use client";

import Link from "next/link";
import { ArrowRight, BookOpenCheck, CheckCircle2, ChevronDown, CircleX, ClipboardCheck, RotateCcw, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { useInvestigation } from "@/context/investigation-context";
import { cn } from "@/lib/cn";
import { ui } from "@/lib/i18n";
import { CHECKLIST, QUIZ, SCAM_TYPES } from "@/lib/learn-content";

const RULES = [
  { t: { en: "Pause when you feel pressure", hi: "दबाव महसूस हो तो रुकें" }, d: { en: "Urgency is the scammer's main tool. A real organisation will still be there after you verify.", hi: "जल्दबाज़ी ठग का मुख्य हथियार है। असली संस्था आपके जाँचने के बाद भी रहेगी।" } },
  { t: { en: "Never share OTPs, PINs or passwords", hi: "OTP, PIN या पासवर्ड कभी साझा न करें" }, d: { en: "Banks and genuine services never ask for these by message or call.", hi: "बैंक और असली सेवाएँ ये संदेश या कॉल पर कभी नहीं माँगतीं।" } },
  { t: { en: "Check the real domain", hi: "असली डोमेन देखें" }, d: { en: "\"paypal.com.secure-login.xyz\" belongs to secure-login.xyz, not PayPal.", hi: "\"paypal.com.secure-login.xyz\" secure-login.xyz की है, PayPal की नहीं।" } },
  { t: { en: "If you already shared details or paid", hi: "यदि जानकारी साझा कर दी या भुगतान कर दिया" }, d: { en: "Call your bank immediately to block cards/UPI, change passwords, and report: in India, cybercrime.gov.in or the 1930 helpline.", hi: "तुरंत बैंक को कॉल करके कार्ड/UPI ब्लॉक कराएँ, पासवर्ड बदलें और रिपोर्ट करें: भारत में cybercrime.gov.in या हेल्पलाइन 1930।" } },
];

function Quiz({ lang }: { lang: "en" | "hi" }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const done = i >= QUIZ.length;
  const q = QUIZ[i];
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);

  function answer(isScam: boolean) {
    if (picked !== null || !q) return;
    setPicked(isScam);
    if (isScam === q.scam) setScore((s) => s + 1);
  }
  function next() { setPicked(null); setI((n) => n + 1); }
  function restart() { setI(0); setPicked(null); setScore(0); }

  return (
    <section aria-label={t("Scam or legit quiz", "ठगी या असली क्विज़")} className="card p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><ShieldAlert aria-hidden className="h-5 w-5 text-accent" />{t("Scam or legit?", "ठगी या असली?")}</h2>
        <span className="text-sm text-muted tabular-nums">{done ? `${score}/${QUIZ.length}` : `${i + 1}/${QUIZ.length}`}</span>
      </div>
      <p className="mt-1 text-sm text-muted">{t("Practice on synthetic messages written for teaching. Nothing is recorded.", "सिखाने के लिए लिखे गए कृत्रिम संदेशों पर अभ्यास करें। कुछ भी दर्ज नहीं होता।")}</p>
      {done ? (
        <div className="mt-5 rounded-xl border border-accent/30 bg-accent/5 p-5 text-center">
          <div className="text-3xl font-bold text-accent tabular-nums">{score}/{QUIZ.length}</div>
          <p className="mt-2 text-sm text-[#cbd5e1]">{score === QUIZ.length ? t("Perfect. You spot the patterns well.", "बढ़िया। आप पैटर्न अच्छी तरह पहचानते हैं।") : t("Review the red flags above and try again. Real scams are designed to look plausible.", "ऊपर के रेड फ़्लैग देखें और फिर प्रयास करें। असली ठगी विश्वसनीय दिखने के लिए बनाई जाती है।")}</p>
          <button type="button" onClick={restart} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm hover:border-accent/50"><RotateCcw aria-hidden className="h-4 w-4" />{t("Try again", "फिर से प्रयास करें")}</button>
        </div>
      ) : q && (
        <div className="mt-5">
          <blockquote lang={lang} className="rounded-xl border border-line bg-bg/50 p-4 text-[15px] leading-relaxed">{q.text[lang]}</blockquote>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {([[true, t("It's a scam", "यह ठगी है")], [false, t("It looks legitimate", "यह असली लगता है")]] as Array<[boolean, string]>).map(([val, label]) => {
              const isAnswer = q.scam === val;
              const chosen = picked === val;
              return (
                <button key={String(val)} type="button" disabled={picked !== null} onClick={() => answer(val)} className={cn("min-h-12 rounded-xl border px-4 text-sm font-medium transition-colors", picked === null ? "border-line-strong bg-surface-2 hover:border-accent/60" : isAnswer ? "border-low/60 bg-low/10 text-low" : chosen ? "border-high/60 bg-high/10 text-high" : "border-line text-muted opacity-60")}>
                  {label}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <div role="status" className="animate-fade-up mt-4 flex items-start gap-3 rounded-xl border border-line bg-surface-2/60 p-4 text-sm">
              {picked === q.scam ? <CheckCircle2 aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-low" /> : <CircleX aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-high" />}
              <div className="flex-1"><div className="font-semibold">{picked === q.scam ? t("Correct", "सही") : t("Not quite", "ठीक नहीं")}: {q.scam ? t("this is a scam.", "यह ठगी है।") : t("this is legitimate.", "यह असली है।")}</div><p className="mt-1 text-muted">{q.why[lang]}</p></div>
              <button type="button" onClick={next} className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 font-medium text-accent-fg">{i === QUIZ.length - 1 ? t("Result", "परिणाम") : t("Next", "अगला")}<ArrowRight aria-hidden className="h-4 w-4" /></button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function Checklist({ lang }: { lang: "en" | "hi" }) {
  const [checked, setChecked] = useState<boolean[]>(() => CHECKLIST.map(() => false));
  const n = checked.filter(Boolean).length;
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  return (
    <section aria-label={t("Before you act", "कदम उठाने से पहले")} className="card p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold"><ClipboardCheck aria-hidden className="h-5 w-5 text-accent" />{t("Before you act: a 30-second check", "कदम उठाने से पहले: 30 सेकंड की जाँच")}</h2>
      <p className="mt-1 text-sm text-muted">{t("Tick each question you can answer \"yes, I'm sure\" to. Anything left unticked is a reason to pause.", "जिस सवाल का जवाब \"हाँ, पक्का\" हो उस पर टिक करें। जो बचा रहे वह रुकने का कारण है।")}</p>
      <ul className="mt-4 space-y-2">
        {CHECKLIST.map((c, i) => (
          <li key={i}>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-line bg-bg/40 px-4 py-2 text-sm hover:border-accent/40">
              <input type="checkbox" checked={checked[i]} onChange={() => setChecked((a) => a.map((v, j) => (j === i ? !v : v)))} className="h-5 w-5 shrink-0 accent-[#2dd4bf]" />
              <span lang={lang}>{c[lang]}</span>
            </label>
          </li>
        ))}
      </ul>
      <p role="status" className={cn("mt-3 rounded-lg border p-3 text-sm", n === CHECKLIST.length ? "border-low/40 bg-low/10 text-low" : "border-medium/40 bg-medium/10 text-medium")}>
        {n === CHECKLIST.length ? t("All clear on these checks. Still verify through an official channel before sending money.", "इन जाँचों में सब ठीक। पैसे भेजने से पहले फिर भी आधिकारिक माध्यम से जाँचें।") : t(`${CHECKLIST.length - n} unanswered. Pause and verify before doing anything.`, `${CHECKLIST.length - n} बाकी। कुछ भी करने से पहले रुकें और जाँचें।`)}
      </p>
    </section>
  );
}

export function LearnGuide() {
  const { lang } = useInvestigation();
  const [openId, setOpenId] = useState<string | null>("kyc");
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  return (
    <div className="space-y-8">
      <PageHeader
        icon={BookOpenCheck}
        title={ui("navLearn", lang)}
        subtitle={t("Learn the patterns behind common scams, test yourself, and know exactly what to do.", "आम ठगी के पीछे के पैटर्न सीखें, खुद को परखें और जानें कि क्या करना है।")}
        actions={<Link href="/investigate" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-accent to-[#22d3ee] px-4 text-sm font-semibold text-accent-fg">{t("Check a message now", "अभी संदेश जाँचें")}<ArrowRight aria-hidden className="h-4 w-4" /></Link>}
      />

      <section aria-label={t("Common scams", "आम ठगियाँ")}>
        <h2 className="text-xl font-semibold">{t("Common scams and their red flags", "आम ठगियाँ और उनके रेड फ़्लैग")}</h2>
        <ul className="mt-4 grid items-start gap-3 lg:grid-cols-2">
          {SCAM_TYPES.map((s) => {
            const open = openId === s.id;
            return (
              <li key={s.id} className="card overflow-hidden">
                <button type="button" aria-expanded={open} onClick={() => setOpenId(open ? null : s.id)} className="flex min-h-14 w-full items-center gap-3 px-5 py-3 text-left">
                  <ShieldAlert aria-hidden className="h-5 w-5 shrink-0 text-high" />
                  <span className="flex-1 font-semibold">{s.name[lang]}</span>
                  <ChevronDown aria-hidden className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")} />
                </button>
                {open && (
                  <div className="animate-fade-up space-y-3 border-t border-line px-5 pb-5 pt-4 text-sm">
                    <p lang={lang} className="leading-relaxed text-[#cbd5e1]">{s.how[lang]}</p>
                    <div>
                      <div className="text-xs font-medium uppercase tracking-wider text-muted">{t("Red flags", "रेड फ़्लैग")}</div>
                      <ul className="mt-1.5 space-y-1.5">{s.flags.map((f, i) => <li key={i} lang={lang} className="flex gap-2"><span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-high" />{f[lang]}</li>)}</ul>
                    </div>
                    <p lang={lang} className="rounded-lg border border-low/30 bg-low/10 p-3 text-low"><span className="font-semibold">{t("Do this: ", "यह करें: ")}</span>{s.doThis[lang]}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <Checklist lang={lang} />
        <Quiz lang={lang} />
      </div>

      <section aria-label={t("Golden rules", "सुनहरे नियम")}>
        <h2 className="text-xl font-semibold">{t("Golden rules", "सुनहरे नियम")}</h2>
        <ol className="mt-4 grid gap-3 md:grid-cols-2">
          {RULES.map((x, i) => (
            <li key={i} className="card flex items-start gap-3 p-5">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-sm font-semibold text-accent">{i + 1}</span>
              <div><h3 className="font-semibold">{x.t[lang]}</h3><p className="mt-1.5 text-sm leading-relaxed text-muted">{x.d[lang]}</p></div>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-muted">{t("Re-check reporting channels against an official source before relying on them.", "रिपोर्टिंग चैनल उपयोग से पहले आधिकारिक स्रोत से दोबारा जाँच लें।")}</p>
      </section>
    </div>
  );
}
