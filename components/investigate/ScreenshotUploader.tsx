"use client";

import { ImageUp, X } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { LIMITS } from "@/lib/types";

interface Props {
  file: File | null;
  onChange(f: File | null): void;
  error?: string | undefined;
  disabled?: boolean;
  lang: "en" | "hi";
}

export function validateImageFile(f: File): string | null {
  if (!(LIMITS.imageTypes as readonly string[]).includes(f.type)) return "Use a PNG, JPEG or WebP image.";
  if (f.size > LIMITS.maxImageBytes) return `Image is too large (max ${LIMITS.maxImageBytes / 1024 / 1024} MB).`;
  return null;
}

export function ScreenshotUploader({ file, onChange, error, disabled, lang }: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    // FileReader callback (not the effect body) sets state; avoids object-URL lifetime issues under StrictMode.
    let cancelled = false;
    const r = new FileReader();
    r.onload = () => { if (!cancelled) setPreview(String(r.result)); };
    r.readAsDataURL(file);
    return () => { cancelled = true; };
  }, [file]);

  const accept = useCallback(
    (f: File | undefined | null) => {
      if (!f) return;
      const err = validateImageFile(f);
      setLocalError(err);
      if (!err) onChange(f);
    },
    [onChange],
  );

  // Paste an image straight from the clipboard.
  useEffect(() => {
    if (disabled) return;
    const onPaste = (e: ClipboardEvent) => {
      const f = [...(e.clipboardData?.files ?? [])].find((x) => x.type.startsWith("image/"));
      if (f) accept(f);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [accept, disabled]);

  const shownError = localError ?? error;

  return (
    <div>
      {file && preview ? (
        <div className="flex items-center gap-4 rounded-xl border border-line bg-surface-2/60 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={lang === "hi" ? "अपलोड किए गए स्क्रीनशॉट का पूर्वावलोकन" : "Uploaded screenshot preview"} className="h-24 w-24 rounded-lg border border-line object-cover" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{file.name}</div>
            <div className="text-xs text-muted">{(file.size / 1024).toFixed(0)} KB</div>
          </div>
          <button type="button" disabled={disabled} onClick={() => { onChange(null); setLocalError(null); }} className="grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface-3 hover:text-text" aria-label={lang === "hi" ? "स्क्रीनशॉट हटाएँ" : "Remove screenshot"}>
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); if (!disabled) accept(e.dataTransfer.files[0]); }}
          className={cn(
            "flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-6 text-center transition-colors",
            drag ? "border-accent bg-accent/10" : "border-line-strong bg-surface-2/40 hover:border-accent/60",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <ImageUp aria-hidden className="h-8 w-8 text-accent" />
          <span className="text-[15px]">{lang === "hi" ? "स्क्रीनशॉट खींचकर छोड़ें, क्लिक करें या पेस्ट करें" : "Drop a screenshot, click to browse, or paste"}</span>
          <span className="text-xs text-muted">PNG · JPEG · WebP · max 4 MB</span>
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={disabled}
            className="sr-only"
            onChange={(e) => { accept(e.target.files?.[0]); e.target.value = ""; }}
          />
        </label>
      )}
      {shownError && <p role="alert" className="mt-2 text-sm text-high">{shownError}</p>}
    </div>
  );
}
