"use client";

import { useRouter } from "next/navigation";
import { useInvestigation } from "@/context/investigation-context";
import { cn } from "@/lib/cn";
import { pick, ui } from "@/lib/i18n";
import { CATEGORY_LABEL, RISK_LABEL, RISK_STYLE } from "@/lib/labels";

export function HistoryList() {
  const { history, open, lang } = useInvestigation();
  const router = useRouter();
  return (
    <div>
      <h1 className="text-3xl font-bold">{ui("navHistory", lang)}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        {lang === "hi"
          ? "यह केवल इस ब्राउज़र सत्र की जाँचें दिखाता है। पेज रीफ़्रेश करने पर ये मिट जाती हैं। TrustLens आपकी सामग्री कहीं सहेजता नहीं।"
          : "Shows only investigations from this browser session. They are cleared when you refresh the page. TrustLens does not store your content."}
      </p>
      {history.length === 0 ? (
        <p className="card mt-8 p-6 text-muted">{ui("noneYet", lang)}</p>
      ) : (
        <ul className="mt-8 space-y-3">
          {history.map((h) => {
            const r = h.report;
            const st = RISK_STYLE[r.classification.risk];
            return (
              <li key={h.id}>
                <button type="button" onClick={() => { open(h.id); router.push("/"); }} className="card flex w-full items-center gap-4 p-4 text-left hover:border-accent/40">
                  <span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-xl border", st.border, st.bg)}><span aria-hidden className={cn("h-3 w-3 rounded-full", st.dot)} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm text-[#cbd5e1]">{r.input.displayText || (lang === "hi" ? "(स्क्रीनशॉट)" : "(screenshot)")}</span>
                    <span className="mt-1 block text-xs text-muted"><span className={cn("font-semibold", st.text)}>{pick(RISK_LABEL[r.classification.risk], lang)}</span> · {pick(CATEGORY_LABEL[r.classification.category], lang)} · {new Date(h.at).toLocaleTimeString()}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
