"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, Trash2, UserRound, Zap } from "lucide-react";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { useAuth } from "@/context/auth-context";
import { useInvestigation } from "@/context/investigation-context";
import { AuthError } from "@/lib/api";

export function AccountPanel() {
  const { lang, history } = useInvestigation();
  const { status, user, signOut, removeAccount } = useAuth();
  const router = useRouter();
  const t = (en: string, hi: string) => (lang === "hi" ? hi : en);
  const [confirming, setConfirming] = useState(false);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (status === "loading") return <p role="status" className="pt-10 text-muted">{t("Loading…", "लोड हो रहा है…")}</p>;

  if (!user) {
    return (
      <div className="space-y-6">
        <PageHeader icon={UserRound} title={t("Account", "खाता")} subtitle={t("You're browsing as a guest. Everything works without an account.", "आप अतिथि के रूप में हैं। खाते के बिना सब कुछ काम करता है।")} />
        <div className="card flex flex-wrap items-center gap-4 p-6">
          <p className="min-w-0 flex-1 text-sm text-muted">{t("Sign in for a higher request allowance. Your investigations are never stored either way.", "अधिक अनुरोध सीमा के लिए साइन इन करें। दोनों तरह आपकी जाँचें कभी सहेजी नहीं जातीं।")}</p>
          <Link href="/auth?next=/account" className="inline-flex min-h-12 items-center rounded-xl bg-gradient-to-r from-accent to-[#22d3ee] px-6 font-semibold text-accent-fg">{t("Sign in", "साइन इन")}</Link>
          <Link href="/auth?mode=signup" className="inline-flex min-h-12 items-center rounded-xl border border-line-strong px-6 hover:border-accent/50">{t("Create account", "खाता बनाएँ")}</Link>
        </div>
      </div>
    );
  }

  async function doSignOut() {
    await signOut();
    router.replace("/");
  }

  async function doDelete(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    try {
      await removeAccount(pw);
      router.replace("/");
    } catch (x) {
      setErr(x instanceof AuthError ? x.message : t("Could not delete the account. Please try again.", "खाता हटाया नहीं जा सका। कृपया फिर प्रयास करें।"));
    } finally {
      setBusy(false);
    }
  }

  const rows: Array<[string, string]> = [
    [t("Name", "नाम"), user.name],
    [t("Email", "ईमेल"), user.email],
    [t("Member since", "सदस्यता तिथि"), new Date(user.createdAt).toLocaleDateString(lang === "hi" ? "hi-IN" : undefined, { dateStyle: "long" })],
  ];

  return (
    <div className="space-y-6">
      <PageHeader icon={UserRound} title={t("Account", "खाता")} subtitle={t("Your profile and session.", "आपकी प्रोफ़ाइल और सत्र।")} actions={
        <button type="button" onClick={() => void doSignOut()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong px-4 text-sm hover:border-accent/50"><LogOut aria-hidden className="h-4 w-4" />{t("Sign out", "साइन आउट")}</button>
      } />
      <section className="card max-w-2xl p-5">
        <h2 className="font-semibold">{t("Profile", "प्रोफ़ाइल")}</h2>
        <dl className="mt-2">{rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-line/60 py-2.5 text-sm last:border-0"><dt className="text-muted">{k}</dt><dd className="break-all text-right">{v}</dd></div>)}</dl>
      </section>
      <section className="card max-w-2xl p-5">
        <h2 className="flex items-center gap-2 font-semibold"><Zap aria-hidden className="h-4 w-4 text-accent" />{t("What your account does", "आपका खाता क्या करता है")}</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
          <li>{t("Gives you a higher request allowance than guests.", "आपको अतिथियों से अधिक अनुरोध सीमा देता है।")}</li>
          <li>{t(`Your ${history.length} investigation(s) this session live only in this browser tab. They are not stored on the server and are not tied to your account.`, `इस सत्र की आपकी ${history.length} जाँच केवल इस ब्राउज़र टैब में हैं। वे सर्वर पर सहेजी नहीं जातीं और आपके खाते से जुड़ी नहीं हैं।`)}</li>
        </ul>
      </section>
      <section className="card max-w-2xl border-high/30 p-5">
        <h2 className="font-semibold text-high">{t("Delete account", "खाता हटाएँ")}</h2>
        <p className="mt-1 text-sm text-muted">{t("Permanently removes your account (email, name and password hash). This cannot be undone.", "आपका खाता (ईमेल, नाम और पासवर्ड हैश) स्थायी रूप से हटाता है। इसे वापस नहीं किया जा सकता।")}</p>
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-high/40 px-4 text-sm text-high hover:bg-high/10"><Trash2 aria-hidden className="h-4 w-4" />{t("Delete my account…", "मेरा खाता हटाएँ…")}</button>
        ) : (
          <form onSubmit={doDelete} className="mt-4 space-y-3">
            <label htmlFor="del-pw" className="text-sm font-medium">{t("Confirm with your password", "अपने पासवर्ड से पुष्टि करें")}</label>
            <input id="del-pw" type="password" autoComplete="current-password" value={pw} onChange={(e) => setPw(e.target.value)} className="min-h-12 w-full rounded-xl border border-line bg-bg/50 px-4 outline-none focus:border-high/60" />
            {err && <p role="alert" className="text-sm text-high">{err}</p>}
            <div className="flex gap-2">
              <button type="submit" disabled={busy || !pw} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-high px-4 text-sm font-semibold text-white disabled:opacity-50">{busy && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}{t("Permanently delete", "स्थायी रूप से हटाएँ")}</button>
              <button type="button" onClick={() => { setConfirming(false); setPw(""); setErr(null); }} className="min-h-11 rounded-xl px-4 text-sm text-muted hover:text-text">{t("Cancel", "रद्द करें")}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
