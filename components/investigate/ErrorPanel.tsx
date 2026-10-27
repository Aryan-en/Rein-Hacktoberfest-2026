"use client";

import { AlertOctagon, Copy } from "lucide-react";
import type { UiError } from "@/context/investigation-context";
import type { Lang } from "@/lib/types";

const FRIENDLY: Record<string, { en: string; hi: string }> = {
  network: { en: "Can't reach the TrustLens server. Check that the backend is running, then try again.", hi: "TrustLens सर्वर तक नहीं पहुँच सके। जाँचें कि बैकएंड चालू है, फिर दोबारा प्रयास करें।" },
  rate_limited: { en: "Too many requests. Please wait a moment before trying again.", hi: "बहुत अधिक अनुरोध। कृपया थोड़ी देर बाद प्रयास करें।" },
  payload_too_large: { en: "That input is too large. Shorten the text or use a smaller image.", hi: "इनपुट बहुत बड़ा है। टेक्स्ट छोटा करें या छोटी छवि इस्तेमाल करें।" },
  unsupported_media_type: { en: "Unsupported file type. Use a PNG, JPEG or WebP image.", hi: "यह फ़ाइल प्रकार समर्थित नहीं। PNG, JPEG या WebP इस्तेमाल करें।" },
  image_analysis_unavailable: { en: "Screenshot analysis isn't available on this server. Paste the text or the link instead.", hi: "इस सर्वर पर स्क्रीनशॉट विश्लेषण उपलब्ध नहीं। टेक्स्ट या लिंक चिपकाएँ।" },
};

export function ErrorPanel({ error, lang, onDismiss }: { error: UiError; lang: Lang; onDismiss(): void }) {
  const f = FRIENDLY[error.code];
  const msg = f ? f[lang] : error.message;
  return (
    <div role="alert" className="card animate-fade-up border-high/40 bg-high/5 p-5">
      <div className="flex items-start gap-3">
        <AlertOctagon aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-high" />
        <div className="min-w-0 flex-1">
          <div className="font-medium">{lang === "hi" ? "जाँच पूरी नहीं हो सकी" : "The investigation could not be completed"}</div>
          <p className="mt-1 text-sm text-muted">{msg}</p>
          {error.requestId && (
            <button type="button" onClick={() => void navigator.clipboard?.writeText(error.requestId!)} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-line px-3 font-mono text-xs text-muted hover:text-text">
              <Copy aria-hidden className="h-3.5 w-3.5" /> {error.requestId}
            </button>
          )}
        </div>
        <button type="button" onClick={onDismiss} className="min-h-9 rounded-lg px-3 text-sm text-muted hover:bg-surface-3 hover:text-text">{lang === "hi" ? "बंद करें" : "Dismiss"}</button>
      </div>
    </div>
  );
}
