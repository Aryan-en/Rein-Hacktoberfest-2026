import type { InvestigationReport, ThreatCategory } from "./types";

export type BucketKey = "phishing" | "job" | "payment" | "impersonation" | "other";

export const BUCKETS: Array<{ key: BucketKey; label: { en: string; hi: string }; color: string; text: string }> = [
  { key: "phishing", label: { en: "Phishing", hi: "फ़िशिंग" }, color: "#ef4444", text: "text-high" },
  { key: "job", label: { en: "Job Scam", hi: "नौकरी ठगी" }, color: "#f59e0b", text: "text-medium" },
  { key: "payment", label: { en: "Payment Fraud", hi: "भुगतान धोखाधड़ी" }, color: "#22c55e", text: "text-low" },
  { key: "impersonation", label: { en: "Impersonation", hi: "रूप धरना" }, color: "#3b82f6", text: "text-blue" },
  { key: "other", label: { en: "Other", hi: "अन्य" }, color: "#94a3b8", text: "text-muted" },
];

export function bucketOf(c: ThreatCategory): BucketKey | null {
  switch (c) {
    case "phishing": case "malware_delivery": return "phishing";
    case "job_scam": case "advance_fee": return "job";
    case "payment_fraud": case "prize_lottery": return "payment";
    case "impersonation": case "tech_support": return "impersonation";
    case "no_clear_threat": case "insufficient_information": return null;
    default: return "other";
  }
}

export interface Distribution {
  /** true when there is no session data and static preview numbers are shown. */
  sample: boolean;
  total: number;
  rows: Array<{ key: BucketKey; count: number; pct: number; recent: number[] }>;
}

// Illustrative numbers shown ONLY before the user has run an investigation; always labelled as sample.
const SAMPLE_PCT: Record<BucketKey, number> = { phishing: 42, job: 23, payment: 18, impersonation: 12, other: 5 };
const SAMPLE_BARS = [0.35, 0.5, 0.3, 0.7, 0.55, 0.9];

/** Distribution of threat categories across this session's investigations (real data). */
export function sessionDistribution(reports: InvestigationReport[]): Distribution {
  const flagged = reports.map((r) => bucketOf(r.classification.category));
  const total = flagged.filter((b) => b !== null).length;
  if (total === 0) {
    return { sample: true, total: 0, rows: BUCKETS.map((b) => ({ key: b.key, count: 0, pct: SAMPLE_PCT[b.key], recent: SAMPLE_BARS })) };
  }
  const last = flagged.slice(0, 6).reverse(); // oldest -> newest
  return {
    sample: false,
    total,
    rows: BUCKETS.map((b) => {
      const count = flagged.filter((x) => x === b.key).length;
      return { key: b.key, count, pct: Math.round((count / total) * 100), recent: last.map((x) => (x === b.key ? 1 : 0.15)) };
    }),
  };
}

/** Counts of indicators by severity for a report (real data for the ring). */
export function severityCounts(r: InvestigationReport): { strong: number; weak: number; info: number } {
  const seen = new Map<string, "strong" | "weak" | "info">();
  for (const s of r.signals) {
    const prev = seen.get(s.id);
    if (!prev || (s.severity === "strong") || (s.severity === "weak" && prev === "info")) seen.set(s.id, s.severity);
  }
  const out = { strong: 0, weak: 0, info: 0 };
  for (const v of seen.values()) out[v]++;
  return out;
}
