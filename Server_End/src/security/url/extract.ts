import { parse as tldParse } from "tldts";
import { MAX_URLS_ANALYZED } from "../../validation/limits";

export interface UrlCandidate {
  raw: string;
  /** Offsets into the text searched. */
  span: [number, number];
}

const CANDIDATE =
  /(?:\b(?:hxxps?|https?):\/\/|\bwww\.)[^\s<>"'`]+|(?<![@\w.-])(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d{1,5})?(?:\/[^\s<>"'`]*)?/gi;

const TRAILING = /[.,;:!?)\]}>'"]+$/;

export function refang(s: string): string {
  return s
    .replace(/^hxxp/i, "http")
    .replace(/\[(?:\.|dot)\]|\((?:\.|dot)\)/gi, ".")
    .replace(/\[:\]/g, ":");
}

export function extractUrls(text: string): { urls: UrlCandidate[]; omitted: number } {
  const seen = new Set<string>();
  const urls: UrlCandidate[] = [];
  let omitted = 0;
  for (const m of text.matchAll(CANDIDATE)) {
    let raw = m[0];
    const start = m.index ?? 0;
    // Skip e-mail addresses: candidate directly preceded by '@' is excluded by lookbehind for bare domains;
    // a "www." match preceded by '@' is also an e-mail domain.
    if (start > 0 && text[start - 1] === "@") continue;
    raw = raw.replace(TRAILING, "");
    if (!raw) continue;
    const hasScheme = /^(?:hxxps?|https?):\/\//i.test(raw);
    if (!hasScheme) {
      // Bare domain: require a real public suffix to avoid "file.txt", "e.g", "3.5" etc.
      const host = refang(raw).split(/[/:?#]/)[0] ?? "";
      const t = tldParse(host);
      if (!t.isIcann || !t.publicSuffix || !t.domain) continue;
    }
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    if (urls.length >= MAX_URLS_ANALYZED) {
      omitted++;
      continue;
    }
    urls.push({ raw, span: [start, start + raw.length] });
  }
  return { urls, omitted };
}
