import { domainToUnicode } from "node:url";
import { parse as tldParse } from "tldts";
import type { UrlAnalysis } from "../../types/investigation";
import { refang } from "./extract";

/**
 * Parses a URL string structurally. Performs NO network access: no DNS, no fetch, no redirects.
 */
export function parseUrl(rawInput: string): UrlAnalysis {
  const raw = rawInput.trim();
  const cleaned = refang(raw);
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(cleaned);
  const candidate = hasScheme ? cleaned : `https://${cleaned.replace(/^\/\//, "")}`;
  let u: URL;
  try {
    u = new URL(candidate);
  } catch {
    return { raw, normalized: null, parsed: null, signals: [] };
  }
  if (!/^https?:$|^ftp:$/.test(u.protocol) || !u.hostname) {
    return { raw, normalized: null, parsed: null, signals: [] };
  }
  const hostname = u.hostname.replace(/\.$/, "").toLowerCase();
  const t = tldParse(hostname);
  const bracketedV6 = hostname.startsWith("[") && hostname.endsWith("]");
  const isIp = t.isIp === true || bracketedV6 || /^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname);
  const subdomain = t.subdomain ? t.subdomain : null;
  return {
    raw,
    normalized: u.href,
    parsed: {
      // Whether the scheme was written by the sender is tracked via `schemeExplicit` below.
      protocol: hasScheme ? u.protocol : `${u.protocol}`,
      hostname,
      unicodeHostname: isIp ? hostname : domainToUnicode(hostname) || hostname,
      registrableDomain: isIp ? null : t.domain,
      subdomain: isIp ? null : subdomain,
      publicSuffix: isIp ? null : t.publicSuffix,
      port: u.port || null,
      path: u.pathname,
      query: u.search,
      hasUserinfo: u.username !== "" || u.password !== "",
      isIp,
      labelCount: hostname.split(".").length,
    },
    signals: [],
  };
}

export function hasExplicitScheme(raw: string): boolean {
  return /^(?:hxxps?|https?|ftp):\/\//i.test(raw.trim());
}
