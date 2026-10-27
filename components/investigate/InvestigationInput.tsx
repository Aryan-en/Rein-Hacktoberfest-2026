"use client";

import { ArrowRight, Image as ImageIcon, Link2, Loader2, Lock, MessageSquareText, Search, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { fileToBase64 } from "@/lib/api";
import { cn } from "@/lib/cn";
import { EXAMPLES, type Example } from "@/lib/examples";
import { pick, ui } from "@/lib/i18n";
import { LIMITS, type AnalyzeRequest, type HealthInfo, type Lang } from "@/lib/types";
import { ScreenshotUploader, validateImageFile } from "./ScreenshotUploader";

type Mode = "text" | "url" | "image";

const TABS: Array<{ mode: Mode; key: "tabText" | "tabUrl" | "tabImage"; icon: LucideIcon }> = [
  { mode: "text", key: "tabText", icon: MessageSquareText },
  { mode: "url", key: "tabUrl", icon: Link2 },
  { mode: "image", key: "tabImage", icon: ImageIcon },
];

interface Props {
  lang: Lang;
  busy: boolean;
  cooldown: number;
  health: HealthInfo | null;
  healthChecked: boolean;
  onSubmit(req: AnalyzeRequest): void;
}

export function InvestigationInput({ lang, busy, cooldown, health, healthChecked, onSubmit }: Props) {
  const [mode, setMode] = useState<Mode>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  // `?demo=<id>` and `?mode=` deep links pre-fill the form (never auto-submit). One-time sync from the
  // URL (an external system) after mount; reading it during render would cause a hydration mismatch.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    const p = new URLSearchParams(window.location.search);
    const demo = EXAMPLES.find((e) => e.id === p.get("demo"));
    if (demo) loadExample(demo);
    else if (p.get("mode") === "url" || p.get("mode") === "image") setMode(p.get("mode") as Mode);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const screenshotDisabled = healthChecked && health?.screenshot === "disabled";
  const serverDown = healthChecked && !health;

  function loadExample(e: Example) {
    setFieldError(null);
    setMode(e.mode);
    if (e.mode === "text") setText(e.value);
    else setUrl(e.value);
  }

  function disabledReason(): string | null {
    if (mode === "text") {
      if (!text.trim()) return "empty";
      if (text.length > LIMITS.maxText) return "too-long";
    } else if (mode === "url") {
      if (!url.trim()) return "empty";
      if (url.length > LIMITS.maxUrl) return "too-long";
    } else {
      if (!file) return "empty";
      if (screenshotDisabled) return "screenshot-off";
    }
    if (cooldown > 0) return "cooldown";
    return null;
  }
  const reason = disabledReason();

  async function submit() {
    if (busy || reason) return;
    setFieldError(null);
    if (mode === "text") return onSubmit({ inputType: "text", text });
    if (mode === "url") return onSubmit({ inputType: "url", url: url.trim() });
    const err = file ? validateImageFile(file) : "Choose an image first.";
    if (err || !file) return setFieldError(err);
    const dataBase64 = await fileToBase64(file);
    onSubmit({ inputType: "image", image: { mimeType: file.type as "image/png" | "image/jpeg" | "image/webp", dataBase64 }, ...(note.trim() ? { note: note.trim() } : {}) });
  }

  function onTabKey(e: KeyboardEvent, i: number) {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    const n = (i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length;
    setMode(TABS[n]!.mode);
    tabRefs.current[n]?.focus();
  }

  const label =
    busy ? ui("analyzing", lang) : cooldown > 0 ? (lang === "hi" ? `${cooldown} सेकंड बाद प्रयास करें` : `Try again in ${cooldown}s`) : ui("analyze", lang);
  const textLen = text.length;

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); void submit(); }}
      className="card border-accent/25 p-4 shadow-[0_0_0_1px_rgba(45,212,191,0.08),0_20px_60px_-30px_rgba(45,212,191,0.35)] sm:p-5"
      aria-busy={busy}
    >
      <div role="tablist" aria-label="Input type" className="grid grid-cols-3 gap-2 rounded-xl border border-line bg-bg/40 p-1.5">
        {TABS.map(({ mode: m, key, icon: Icon }, i) => (
          <button
            key={m}
            ref={(el) => { tabRefs.current[i] = el; }}
            type="button"
            role="tab"
            id={`tab-${m}`}
            aria-selected={mode === m}
            aria-controls={`panel-${m}`}
            tabIndex={mode === m ? 0 : -1}
            disabled={busy}
            onKeyDown={(e) => onTabKey(e, i)}
            onClick={() => { setMode(m); setFieldError(null); }}
            className={cn(
              "flex min-h-12 items-center justify-center gap-2 rounded-lg border-b-2 px-2 text-sm font-medium transition-colors sm:text-[15px]",
              mode === m ? "border-accent bg-accent/10 text-text" : "border-transparent text-muted hover:bg-surface-2 hover:text-text",
            )}
          >
            <Icon aria-hidden className={cn("hidden h-5 w-5 shrink-0 sm:block", mode === m && "text-accent")} />
            <span className="text-center text-[13px] leading-tight sm:truncate sm:text-inherit">{ui(key, lang)}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${mode}`} aria-labelledby={`tab-${mode}`} className="mt-4">
        {mode === "text" && (
          <div className="relative">
            <label htmlFor="msg" className="sr-only">{ui("tabText", lang)}</label>
            <textarea
              id="msg"
              value={text}
              readOnly={busy}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); void submit(); } }}
              placeholder={ui("placeholderText", lang)}
              rows={7}
              aria-describedby="msg-count"
              className="min-h-[170px] w-full resize-y rounded-xl border border-line bg-bg/50 p-4 pb-9 text-[15px] leading-relaxed outline-none placeholder:text-faint focus:border-accent/60"
            />
            {text && !busy && <button type="button" onClick={() => setText("")} className="absolute bottom-2 left-3 inline-flex min-h-8 items-center rounded-md px-2 text-xs text-muted hover:text-text">{lang === "hi" ? "साफ़ करें" : "Clear"}</button>}
            <span id="msg-count" className={cn("absolute bottom-3 right-4 text-xs tabular-nums", textLen > LIMITS.maxText ? "text-high" : textLen > LIMITS.maxText * 0.9 ? "text-medium" : "text-muted")}>
              {textLen.toLocaleString()}/{LIMITS.maxText.toLocaleString()}
            </span>
          </div>
        )}
        {mode === "url" && (
          <div>
            <label htmlFor="url" className="sr-only">{ui("tabUrl", lang)}</label>
            <input
              id="url"
              value={url}
              readOnly={busy}
              onChange={(e) => setUrl(e.target.value)}
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              placeholder={ui("placeholderUrl", lang)}
              className="min-h-14 w-full rounded-xl border border-line bg-bg/50 px-4 font-mono text-sm outline-none placeholder:font-sans placeholder:text-faint focus:border-accent/60"
            />
            <p className="mt-2 text-xs text-muted">{lang === "hi" ? "हम केवल लिंक की बनावट जाँचते हैं। उसे कभी नहीं खोलते।" : "We analyze the link's structure only. We never open it."}</p>
          </div>
        )}
        {mode === "image" && (
          <div className="space-y-3">
            {screenshotDisabled && (
              <p role="status" className="rounded-lg border border-medium/40 bg-medium/10 p-3 text-sm text-medium">
                {lang === "hi" ? "इस सर्वर पर स्क्रीनशॉट विश्लेषण चालू नहीं है। कृपया टेक्स्ट या लिंक चिपकाएँ।" : "Screenshot analysis isn't enabled on this server (no vision model configured). Paste the text or the link instead."}
              </p>
            )}
            <ScreenshotUploader file={file} onChange={setFile} disabled={busy} lang={lang} error={fieldError ?? undefined} />
            <div>
              <label htmlFor="note" className="text-xs text-muted">{lang === "hi" ? "कुछ बताना है? (वैकल्पिक)" : "Anything we should know? (optional)"}</label>
              <input id="note" value={note} maxLength={LIMITS.maxNote} onChange={(e) => setNote(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-line bg-bg/50 px-3 text-sm outline-none focus:border-accent/60" />
            </div>
          </div>
        )}
        {mode !== "image" && fieldError && <p role="alert" className="mt-2 text-sm text-high">{fieldError}</p>}
        {textLen > LIMITS.maxText && mode === "text" && (
          <p role="alert" className="mt-2 text-sm text-high">{lang === "hi" ? `सीमा ${LIMITS.maxText} अक्षर है।` : `Limit is ${LIMITS.maxText.toLocaleString()} characters.`}</p>
        )}
      </div>

      {mode !== "image" && <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted">{ui("tryExample", lang)}</span>
        {EXAMPLES.map((e) => (
          <button key={e.id} type="button" disabled={busy} onClick={() => loadExample(e)} className="min-h-9 rounded-lg border border-line bg-surface-2/60 px-3 text-xs transition-colors hover:border-accent/50 hover:text-accent sm:text-sm">
            {pick(e.label, lang)}
          </button>
        ))}
      </div>}

      {serverDown && (
        <p role="alert" className="mt-4 rounded-lg border border-high/40 bg-high/10 p-3 text-sm text-high">
          {lang === "hi" ? "TrustLens सर्वर तक नहीं पहुँचा जा सका। बैकएंड चालू करें और पेज रीफ़्रेश करें।" : "Can't reach the TrustLens server. Start the backend (Server_End) and refresh."}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !!reason}
        className="mt-4 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-accent to-[#22d3ee] text-base font-semibold text-accent-fg shadow-[0_10px_30px_-10px_rgba(45,212,191,0.7)] transition-[filter,opacity] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
      >
        {busy ? <Loader2 aria-hidden className="h-5 w-5 animate-spin" /> : <Search aria-hidden className="h-5 w-5" />}
        {label}
        {!busy && cooldown === 0 && <ArrowRight aria-hidden className="h-5 w-5" />}
      </button>
      <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-accent/90">
        <Lock aria-hidden className="h-3.5 w-3.5 shrink-0" />
        {ui("privacy", lang)}
      </p>
    </form>
  );
}
