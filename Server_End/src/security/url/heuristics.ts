import type { InputSource, Signal, UrlAnalysis } from "../../types/investigation";
import { BRANDS, SHORTENERS, SUSPICIOUS_TLDS } from "../data/brands";
import { makeSignal } from "../messages";
import { hasExplicitScheme, parseUrl } from "./parse";

const CONFUSABLES: Record<string, string> = {
  // Cyrillic
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "х": "x", "у": "y", "і": "i", "ј": "j", "ѕ": "s", "ԁ": "d", "һ": "h", "ӏ": "l", "ԛ": "q", "ԝ": "w",
  // Greek
  "α": "a", "ο": "o", "ν": "v", "ι": "i", "ρ": "p", "τ": "t", "κ": "k", "υ": "u", "ε": "e",
  // Latin lookalikes
  "ɡ": "g", "ı": "i", "ⅼ": "l",
};

/** Maps look-alike characters and common digit swaps (paypa1 → paypal) to a comparable form. */
export function foldConfusables(s: string): string {
  let out = "";
  for (const ch of s.toLowerCase()) out += CONFUSABLES[ch] ?? ch;
  return out
    .replace(/rn/g, "m")
    .replace(/vv/g, "w")
    .replace(/0/g, "o")
    .replace(/1/g, "l")
    .replace(/3/g, "e")
    .replace(/5/g, "s")
    .replace(/\$/g, "s");
}

/** Optimal string alignment distance (Damerau–Levenshtein with adjacent transpositions). */
export function editDistance(a: string, b: string): number {
  const d: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) d[i]![0] = i;
  for (let j = 0; j <= b.length; j++) d[0]![j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(d[i - 1]![j]! + 1, d[i]![j - 1]! + 1, d[i - 1]![j - 1]! + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, d[i - 2]![j - 2]! + 1);
      d[i]![j] = v;
    }
  }
  return d[a.length]![b.length]!;
}

function scriptsOf(label: string): Set<string> {
  const s = new Set<string>();
  for (const ch of label) {
    if (/\p{Script=Latin}/u.test(ch)) s.add("Latin");
    else if (/\p{Script=Cyrillic}/u.test(ch)) s.add("Cyrillic");
    else if (/\p{Script=Greek}/u.test(ch)) s.add("Greek");
  }
  return s;
}

function isOfficial(registrable: string | null, domains: string[]): boolean {
  if (!registrable) return false;
  return domains.includes(registrable);
}

export function analyzeUrl(raw: string, span: [number, number] | null, source: InputSource = "input"): UrlAnalysis {
  const base = parseUrl(raw);
  const p = base.parsed;
  const signals: Signal[] = [];
  const add = (id: string, severity?: Signal["severity"]) =>
    signals.push(makeSignal(id, { matched: raw, span, source, ...(severity ? { severity } : {}) }));

  if (!p) {
    add("url_unparseable");
    return { ...base, signals };
  }

  if (p.isIp) add("url_ip_host");
  if (p.hasUserinfo) add("url_userinfo");

  const labels = p.hostname.split(".");
  const hasPuny = labels.some((l) => l.startsWith("xn--"));
  let brandFired = false;

  if (!p.isIp) {
    const registrable = p.registrableDomain;
    const suffix = p.publicSuffix ?? "";
    const suffixLen = suffix ? suffix.split(".").length : 0;
    const nameLabels = suffixLen ? labels.slice(0, labels.length - suffixLen) : labels;
    const regLabel = nameLabels[nameLabels.length - 1] ?? "";
    const unicodeNameLabels = p.unicodeHostname.split(".").slice(0, nameLabels.length);
    const foldedLabels = unicodeNameLabels.map(foldConfusables);
    const parts = new Set<string>();
    for (const l of [...foldedLabels, ...nameLabels]) {
      parts.add(l);
      for (const piece of l.split("-")) if (piece) parts.add(piece);
    }
    const foldedJoined = foldedLabels.join(".");
    const rawJoined = nameLabels.join(".");

    // 1) Official domain used as a subdomain of someone else's domain.
    let deceptive = false;
    if (p.subdomain) {
      for (const b of BRANDS) {
        for (const d of b.domains) {
          if (d.includes(".") && registrable !== d && !isOfficial(registrable, b.domains) && p.subdomain.includes(d)) {
            deceptive = true;
            break;
          }
        }
        if (deceptive) break;
      }
    }
    if (deceptive) {
      add("url_deceptive_subdomain");
      brandFired = true;
    } else {
      // 2) Typosquat / look-alike of an official brand domain.
      let lookalike = false;
      for (const b of BRANDS) {
        if (isOfficial(registrable, b.domains)) continue;
        for (const d of b.domains) {
          const L = d.split(".")[0] ?? "";
          if (L.length < 5 || L === regLabel) continue;
          const foldedReg = foldedLabels[foldedLabels.length - 1] ?? "";
          const dist = Math.min(editDistance(regLabel, L), editDistance(foldedReg, foldConfusables(L)));
          const tol = L.length > 10 ? 2 : 1;
          if (dist <= tol && Math.abs(regLabel.length - L.length) <= tol) {
            lookalike = true;
            break;
          }
        }
        if (lookalike) break;
      }
      if (lookalike) {
        add("url_lookalike_domain");
        brandFired = true;
      } else {
        // 3) Brand token present but domain is not official.
        let mismatch = false;
        for (const b of BRANDS) {
          if (isOfficial(registrable, b.domains)) continue;
          for (const tok of b.tokens) {
            const hit = parts.has(tok) || (tok.length >= 5 && (foldedJoined.includes(tok) || rawJoined.includes(tok)));
            if (hit) {
              mismatch = true;
              break;
            }
          }
          if (mismatch) break;
        }
        if (mismatch) {
          add("url_brand_mismatch");
          brandFired = true;
        }
      }
    }

    if (p.subdomain && p.subdomain.split(".").length >= 4) add("url_excess_subdomains");
    if (registrable && SHORTENERS.has(registrable)) add("url_shortener");
    const tld = suffix.split(".").pop() ?? "";
    if (tld && SUSPICIOUS_TLDS.has(tld)) add("url_suspicious_tld");
  }

  if (hasPuny) add("url_punycode", brandFired ? "strong" : undefined);
  const mixed = p.unicodeHostname.split(".").some((l) => {
    const sc = scriptsOf(l);
    return sc.has("Latin") && (sc.has("Cyrillic") || sc.has("Greek"));
  });
  if (mixed) add("url_mixed_script");

  // Encoding abuse, evaluated on the raw string the sender wrote.
  const authority = raw.replace(/^[a-z]+:\/\//i, "").split(/[/?#]/)[0] ?? "";
  const pct = raw.match(/%[0-9a-f]{2}/gi) ?? [];
  const tail = p.path + p.query;
  if (
    /%25[0-9a-f]{2}/i.test(raw) ||
    /%(?:40|2f|5c)/i.test(authority) ||
    (pct.length >= 8 && pct.length * 3 > tail.length * 0.25)
  ) {
    add("url_encoding_abuse");
  }

  if (hasExplicitScheme(raw) && p.protocol === "http:") add("url_no_tls");
  if (p.port) add("url_nonstandard_port");
  if (tail.length > 200 || /[0-9a-f]{32,}/i.test(tail)) add("url_long_or_hex_path");

  return { ...base, signals };
}
