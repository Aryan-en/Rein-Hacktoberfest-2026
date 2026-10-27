"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, ShieldCheck, UserRound, Zap, type LucideIcon } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { LanguageSwitcher } from "@/components/common/LanguageSwitcher";
import { Logo } from "@/components/layout/Logo";
import { useAuth } from "@/context/auth-context";
import { useInvestigation } from "@/context/investigation-context";
import { AuthError } from "@/lib/api";
import { cn } from "@/lib/cn";

type Mode = "signin" | "signup";

/** Only same-site relative paths are allowed as a post-login destination (prevents open redirects). */
function safeNext(raw: string | null): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/investigate";
}

function strength(pw: string): { score: 0 | 1 | 2 | 3; label: { en: string; hi: string } } {
  // Length-and-variety hint only. It is not a security guarantee.
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) && pw.length >= 12) s = Math.max(s, 3);
  const score = Math.min(3, pw.length === 0 ? 0 : Math.max(1, s)) as 0 | 1 | 2 | 3;
  return { score, label: [{ en: "", hi: "" }, { en: "Weak", hi: "कमज़ोर" }, { en: "Okay", hi: "ठीक" }, { en: "Strong", hi: "मज़बूत" }][score]! };
}

export function AuthForm() {
  const { lang } = useInvestigation();
  const { status, signIn, signUp } = useAuth();
  const router = useRouter();
  const uid = useId();
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);

  const [mode, setMode] = useState<Mode>("signin");
  const [next, setNext] = useState("/investigate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [wait, setWait] = useState(0);
  const [justAuthed, setJustAuthed] = useState(false);
  const [ready, setReady] = useState(false); // avoids a flash of the wrong mode before the URL is read

  useEffect(() => {
    // One-time sync from the URL (external system) after mount; reading it during render would break hydration.
    /* eslint-disable react-hooks/set-state-in-effect */
    const p = new URLSearchParams(window.location.search);
    if (p.get("mode") === "signup") setMode("signup");
    setNext(safeNext(p.get("next")));
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Already signed in (and not because of this form's own submit): go to the account page.
  useEffect(() => {
    if (status === "authed" && !justAuthed) router.replace("/account");
  }, [status, justAuthed, router]);

  useEffect(() => {
    if (wait <= 0) return;
    const id = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(id);
  }, [wait]);

  function switchMode(m: Mode) {
    setMode(m);
    setFormError(null);
    setFieldErrors({});
  }

  function validate(): Record<string, string[]> {
    const e: Record<string, string[]> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) e.email = [t("Enter a valid email address.", "मान्य ईमेल पता दर्ज करें।")];
    if (mode === "signup" && password.length < 8) e.password = [t("Use at least 8 characters.", "कम से कम 8 अक्षर रखें।")];
    if (mode === "signin" && !password) e.password = [t("Enter your password.", "पासवर्ड दर्ज करें।")];
    return e;
  }

  async function onSubmit(ev: FormEvent) {
    ev.preventDefault();
    if (busy || wait > 0) return;
    setFormError(null);
    const v = validate();
    setFieldErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      setJustAuthed(true);
      if (mode === "signup") await signUp(email.trim(), password, name);
      else await signIn(email.trim(), password);
      router.replace(next);
    } catch (e) {
      setJustAuthed(false);
      if (e instanceof AuthError) {
        setFieldErrors(e.fieldErrors ?? {});
        setFormError(e.fieldErrors ? null : e.message);
        if (e.retryAfterSeconds) setWait(e.retryAfterSeconds);
      } else {
        setFormError(t("Something went wrong. Please try again.", "कुछ गड़बड़ हुई। कृपया फिर प्रयास करें।"));
      }
    } finally {
      setBusy(false);
    }
  }

  const pw = strength(password);
  const perks: Array<{ icon: LucideIcon; en: string; hi: string }> = [
    { icon: Zap, en: "A higher request allowance than guests", hi: "अतिथियों से अधिक अनुरोध सीमा" },
    { icon: Lock, en: "Passwords are hashed (scrypt) and never stored in plain text", hi: "पासवर्ड हैश (scrypt) होते हैं, सादे रूप में कभी नहीं सहेजे जाते" },
    { icon: ShieldCheck, en: "Your investigations are never stored, with or without an account", hi: "खाते के साथ या बिना, आपकी जाँचें कभी सहेजी नहीं जातीं" },
  ];
  const inputCls = (err?: string[]) => cn("mt-1.5 min-h-12 w-full rounded-xl border bg-bg/50 px-4 text-[15px] outline-none placeholder:text-faint focus:border-accent/60", err?.length ? "border-high/60" : "border-line");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden border-r border-line bg-surface/40 p-12 lg:flex lg:flex-col">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(70%_50%_at_30%_0%,rgba(45,212,191,0.16),transparent_70%),radial-gradient(50%_40%_at_90%_100%,rgba(59,130,246,0.12),transparent_70%)]" />
        <Link href="/" aria-label="TrustLens AI home" className="relative w-fit"><Logo tagline={t("Understand the Threat. Verify the Evidence.", "खतरे को समझें। सबूत जाँचें।")} /></Link>
        <div className="relative mt-auto max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">{t("An account is optional. The investigation is the point.", "खाता वैकल्पिक है। असली चीज़ जाँच है।")}</h2>
          <ul className="mt-8 space-y-4">
            {perks.map((p) => (
              <li key={p.en} className="flex items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/10"><p.icon aria-hidden className="h-4 w-4 text-accent" /></span><span className="pt-1.5 text-sm leading-snug text-[#cbd5e1]">{lang === "hi" ? p.hi : p.en}</span></li>
            ))}
          </ul>
        </div>
        <p className="relative mt-12 text-xs text-muted">{t("Open source · Built for Hacktoberfest Hack Day Chandigarh 2026", "ओपन सोर्स · Hacktoberfest Hack Day चंडीगढ़ 2026 के लिए")}</p>
      </aside>

      {/* Form */}
      <main id="main" className="relative flex flex-col px-4 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-text"><ArrowLeft aria-hidden className="h-4 w-4" />{t("Back to home", "होम पर लौटें")}</Link>
          <LanguageSwitcher />
        </div>
        <div className={cn("mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10", !ready && "invisible")}>
          <Link href="/" aria-label="TrustLens AI home" className="mb-8 block lg:hidden"><Logo /></Link>
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-accent/30 bg-accent/10"><UserRound aria-hidden className="h-6 w-6 text-accent" /></span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">{mode === "signup" ? t("Create your account", "अपना खाता बनाएँ") : t("Welcome back", "वापसी पर स्वागत")}</h1>
          <p className="mt-2 text-muted">{mode === "signup" ? t("Free, and only needs an email and password.", "मुफ़्त, और केवल ईमेल व पासवर्ड चाहिए।") : t("Sign in to your TrustLens account.", "अपने TrustLens खाते में साइन इन करें।")}</p>

          <div role="tablist" aria-label={t("Sign in or create account", "साइन इन या खाता बनाएँ")} className="mt-6 grid grid-cols-2 gap-1.5 rounded-xl border border-line bg-bg/40 p-1.5">
            {(["signin", "signup"] as const).map((m) => (
              <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)} className={cn("min-h-11 rounded-lg text-sm font-medium transition-colors", mode === m ? "bg-accent/15 text-accent" : "text-muted hover:text-text")}>
                {m === "signin" ? t("Sign in", "साइन इन") : t("Create account", "खाता बनाएँ")}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4" aria-busy={busy}>
            {formError && <div role="alert" className="rounded-xl border border-high/40 bg-high/10 p-3.5 text-sm text-high">{formError}{wait > 0 && <span className="tabular-nums"> ({wait}s)</span>}</div>}

            {mode === "signup" && (
              <div>
                <label htmlFor={`${uid}-name`} className="text-sm font-medium">{t("Name", "नाम")} <span className="font-normal text-muted">({t("optional", "वैकल्पिक")})</span></label>
                <input id={`${uid}-name`} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} className={inputCls(fieldErrors.name)} aria-invalid={!!fieldErrors.name} />
                {fieldErrors.name && <p role="alert" className="mt-1.5 text-sm text-high">{fieldErrors.name[0]}</p>}
              </div>
            )}
            <div>
              <label htmlFor={`${uid}-email`} className="text-sm font-medium">{t("Email", "ईमेल")}</label>
              <input id={`${uid}-email`} type="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" spellCheck={false} placeholder="you@example.com" className={inputCls(fieldErrors.email)} aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? `${uid}-email-err` : undefined} />
              {fieldErrors.email && <p id={`${uid}-email-err`} role="alert" className="mt-1.5 text-sm text-high">{fieldErrors.email[0]}</p>}
            </div>
            <div>
              <label htmlFor={`${uid}-pw`} className="text-sm font-medium">{t("Password", "पासवर्ड")}</label>
              <div className="relative">
                <input id={`${uid}-pw`} type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} className={cn(inputCls(fieldErrors.password), "pr-12")} aria-invalid={!!fieldErrors.password} aria-describedby={`${uid}-pw-hint`} />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? t("Hide password", "पासवर्ड छिपाएँ") : t("Show password", "पासवर्ड दिखाएँ")} aria-pressed={show} className="absolute right-1.5 top-1/2 mt-[3px] grid h-10 w-10 -translate-y-1/2 place-items-center rounded-lg text-muted hover:text-text">{show ? <EyeOff aria-hidden className="h-5 w-5" /> : <Eye aria-hidden className="h-5 w-5" />}</button>
              </div>
              {fieldErrors.password && <p role="alert" className="mt-1.5 text-sm text-high">{fieldErrors.password[0]}</p>}
              {mode === "signup" && (
                <div id={`${uid}-pw-hint`} className="mt-2">
                  <div aria-hidden className="flex gap-1.5">{[1, 2, 3].map((i) => <span key={i} className={cn("h-1.5 flex-1 rounded-full bg-surface-3", pw.score >= i && (pw.score === 1 ? "bg-high" : pw.score === 2 ? "bg-medium" : "bg-low"))} />)}</div>
                  <p className="mt-1.5 text-xs text-muted">{password ? `${pw.label[lang]} · ` : ""}{t("At least 8 characters; longer is better. This is a length hint, not a guarantee.", "कम से कम 8 अक्षर; लंबा बेहतर। यह लंबाई का संकेत है, गारंटी नहीं।")}</p>
                </div>
              )}
            </div>

            <button type="submit" disabled={busy || wait > 0} className="flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-[#22d3ee] text-base font-semibold text-accent-fg shadow-[0_10px_30px_-10px_rgba(45,212,191,0.7)] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
              {busy && <Loader2 aria-hidden className="h-5 w-5 animate-spin" />}
              {wait > 0 ? t(`Try again in ${wait}s`, `${wait} सेकंड बाद प्रयास करें`) : mode === "signup" ? t("Create account", "खाता बनाएँ") : t("Sign in", "साइन इन")}
            </button>
          </form>

          <div className="mt-6 space-y-3 text-center text-sm">
            <p className="text-muted">
              {mode === "signin" ? t("New here?", "नए हैं?") : t("Already have an account?", "पहले से खाता है?")}{" "}
              <button type="button" onClick={() => switchMode(mode === "signin" ? "signup" : "signin")} className="font-medium text-accent hover:underline">{mode === "signin" ? t("Create an account", "खाता बनाएँ") : t("Sign in", "साइन इन")}</button>
            </p>
            <p><Link href="/investigate" className="text-muted underline-offset-4 hover:text-text hover:underline">{t("Continue as a guest", "अतिथि के रूप में जारी रखें")}</Link></p>
            {mode === "signin" && <p className="text-xs text-muted">{t("Password reset isn't available in this version.", "इस संस्करण में पासवर्ड रीसेट उपलब्ध नहीं है।")}</p>}
          </div>
        </div>
      </main>
    </div>
  );
}
