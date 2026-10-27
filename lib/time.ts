import type { Lang } from "./types";

export function relTime(iso: string, lang: Lang): string {
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const f = new Intl.RelativeTimeFormat(lang === "hi" ? "hi" : "en", { numeric: "auto" });
  return s < 60 ? f.format(-s, "second") : s < 3600 ? f.format(-Math.round(s / 60), "minute") : f.format(-Math.round(s / 3600), "hour");
}

export const clock = (iso: string): string => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
