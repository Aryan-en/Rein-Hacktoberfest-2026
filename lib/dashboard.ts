import { pick } from "./i18n";
import { CATEGORY_LABEL } from "./labels";
import { BUCKETS, bucketOf, type BucketKey } from "./stats";
import { clock } from "./time";
import type { InvestigationReport, Lang, LocalizedText, RiskLevel } from "./types";

export type DashboardMode = "sample" | "session";
export type AlertIcon = "alert" | "mail" | "phone" | "user" | "card";

export interface Kpi { key: string; label: LocalizedText; value: string; sub: string; delta?: string; spark: number[]; color: string }
export interface AlertRow { id: string; risk: "high" | "medium" | "low"; icon: AlertIcon; title: string; line2: string; line3: string; at: string | null; agoText?: string; reportId?: string }
export interface DetectionRow { time: string; target: string; type: string; risk: RiskLevel; desc: string; reportId?: string }
export interface Rank { label: string; pct: number }
export interface Insight { icon: "up" | "bulb" | "shield"; big: string; text: string }
export interface DonutSeg { label: string; value: number; color: string }
export interface LineSeries { label: string; color: string; values: number[] }

export interface DashboardData {
  mode: DashboardMode;
  kpis: Kpi[];
  donut: { segments: DonutSeg[]; total: number };
  line: { title: string; xLabels: string[]; series: LineSeries[]; yMax: number };
  ranks: { title: string; rows: Rank[] };
  alerts: AlertRow[];
  detections: DetectionRow[];
  insights: Insight[];
  insightsNote: string;
  gauge: { value: number; flagged: number };
}

const L = (en: string, hi: string): LocalizedText => ({ en, hi });
const KPI_LABELS = {
  threats: L("Threats flagged", "चिह्नित खतरे"),
  urls: L("Malicious URLs", "संदिग्ध URL"),
  scams: L("Scam messages", "ठगी संदेश"),
  imp: L("Impersonation attempts", "रूप धरने के प्रयास"),
};
const bump = (n: number) => (a: number[]) => [...a, (a[a.length - 1] ?? 0) + n];

// ---------- SAMPLE (illustrative only; always shown with a SAMPLE badge) ----------
export const SAMPLE: DashboardData = {
  mode: "sample",
  kpis: [
    { key: "threats", label: KPI_LABELS.threats, value: "1,27,853", sub: "sample", delta: "↑ 24%", spark: [3, 5, 4, 7, 6, 9, 7, 11, 8, 12, 9, 14], color: "#ef4444" },
    { key: "urls", label: KPI_LABELS.urls, value: "48,231", sub: "sample", delta: "↑ 31%", spark: [4, 6, 5, 8, 7, 6, 9, 8, 10, 9, 12, 11], color: "#22c55e" },
    { key: "scams", label: KPI_LABELS.scams, value: "52,690", sub: "sample", delta: "↑ 18%", spark: [5, 4, 7, 6, 8, 7, 6, 9, 8, 10, 9, 10], color: "#3b82f6" },
    { key: "imp", label: KPI_LABELS.imp, value: "18,442", sub: "sample", delta: "↑ 27%", spark: [2, 4, 3, 6, 5, 8, 6, 9, 7, 10, 8, 12], color: "#a855f7" },
  ],
  donut: { total: 127853, segments: [{ label: "Phishing", value: 42, color: "#ef4444" }, { label: "Job Scam", value: 23, color: "#f59e0b" }, { label: "Payment Fraud", value: 18, color: "#22c55e" }, { label: "Impersonation", value: 12, color: "#3b82f6" }, { label: "Malware Links", value: 5, color: "#8b5cf6" }] },
  line: {
    title: "Threat activity", xLabels: ["10:00", "14:00", "18:00", "22:00", "02:00", "06:00", "10:00"], yMax: 20,
    series: [
      { label: "Phishing", color: "#ef4444", values: [9, 12, 15, 13, 17, 14, 16] },
      { label: "Job Scam", color: "#f59e0b", values: [6, 8, 7, 11, 9, 12, 10] },
      { label: "Payment Fraud", color: "#22c55e", values: [4, 5, 7, 6, 8, 7, 9] },
      { label: "Impersonation", color: "#3b82f6", values: [2, 4, 3, 5, 4, 6, 5] },
    ],
  },
  ranks: { title: "Top targeted", rows: [{ label: "SBI", pct: 14 }, { label: "Google", pct: 11 }, { label: "Amazon", pct: 9 }, { label: "Flipkart", pct: 7 }, { label: "Microsoft", pct: 6 }] },
  alerts: [
    { id: "s1", risk: "high", icon: "alert", title: "Phishing Website Detected", line2: "sbi-verify-secure.example", line3: "Impersonating a bank", at: null, agoText: "sample" },
    { id: "s2", risk: "medium", icon: "mail", title: "Job Scam Message Surge", line2: "Multiple reports detected", line3: "“Work from home: earn ₹50,000/month”", at: null, agoText: "sample" },
    { id: "s3", risk: "high", icon: "phone", title: "Fake Delivery SMS Campaign", line2: "Unverified sender IDs", line3: "“Your package is pending. Pay ₹49”", at: null, agoText: "sample" },
    { id: "s4", risk: "low", icon: "user", title: "Impersonation Attempt", line2: "lookalike domain", line3: "Similar to an official site domain", at: null, agoText: "sample" },
    { id: "s5", risk: "high", icon: "card", title: "Payment Fraud Alert", line2: "refund-support.example", line3: "Fake UPI refund portal", at: null, agoText: "sample" },
  ],
  detections: [
    { time: "10:42", target: "amazon-offer.example/free-…", type: "Phishing", risk: "high", desc: "Fake giveaway page" },
    { time: "10:40", target: "WhatsApp message", type: "Job Scam", risk: "medium", desc: "Work-from-home scam wording" },
    { time: "10:38", target: "bank-verify.example", type: "Banking Scam", risk: "high", desc: "Bank impersonation" },
    { time: "10:36", target: "Email from hr@careers.example", type: "Impersonation", risk: "medium", desc: "Fake recruitment email" },
  ],
  insights: [
    { icon: "up", big: "+31%", text: "Increase in phishing websites (sample figure)" },
    { icon: "bulb", big: "2.4x", text: "Rise in job-scam messages compared to last week (sample figure)" },
    { icon: "shield", big: "~18K", text: "Users protected from malicious links (sample figure)" },
  ],
  insightsNote: "Sample figures",
  gauge: { value: 0, flagged: 0 },
};

// ---------- SESSION (real: derived from this tab's investigations) ----------
const isFlagged = (r: InvestigationReport) => r.classification.risk === "high" || r.classification.risk === "medium";
const hasBrandSignal = (r: InvestigationReport) => r.signals.some((s) => ["url_brand_mismatch", "url_lookalike_domain", "url_deceptive_subdomain"].includes(s.id));
const urlThreats = (r: InvestigationReport) => r.urls.filter((u) => u.signals.some((s) => s.severity === "strong")).length;

function iconFor(r: InvestigationReport): AlertIcon {
  const c = r.classification.category;
  if (c === "impersonation") return "user";
  if (c === "payment_fraud" || c === "advance_fee") return "card";
  if (r.input.type === "text" && r.urls.length === 0) return "mail";
  return "alert";
}

export function sessionData(reports: InvestigationReport[], at: string[], lang: Lang): DashboardData {
  const chrono = [...reports].reverse(); // oldest -> newest
  const n = reports.length;
  const flagged = reports.filter(isFlagged);

  let thr: number[] = [], url: number[] = [], scam: number[] = [], imp: number[] = [];
  for (const r of chrono) {
    thr = bump(isFlagged(r) ? 1 : 0)(thr);
    url = bump(urlThreats(r))(url);
    scam = bump(isFlagged(r) && r.input.type !== "url" ? 1 : 0)(scam);
    imp = bump(r.classification.category === "impersonation" || hasBrandSignal(r) ? 1 : 0)(imp);
  }
  const last = (a: number[]) => a[a.length - 1] ?? 0;
  const pad = (a: number[]) => (a.length === 1 ? [0, a[0]!] : a);
  const sub = lang === "hi" ? "इस सत्र में" : "this session";

  // Categories
  const counts = new Map<BucketKey, number>();
  for (const r of reports) {
    const b = bucketOf(r.classification.category);
    if (b) counts.set(b, (counts.get(b) ?? 0) + 1);
  }
  const segments = BUCKETS.map((b) => ({ label: b.label[lang], value: counts.get(b.key) ?? 0, color: b.color })).filter((s) => s.value > 0);
  const donutTotal = segments.reduce((a, s) => a + s.value, 0);

  // Indicator activity per investigation
  const recent = chrono.slice(-12);
  const sev = recent.map((r) => {
    const m = new Map<string, "strong" | "weak" | "info">();
    for (const s of r.signals) m.set(s.id, s.severity);
    const o = { strong: 0, weak: 0, info: 0 };
    for (const v of m.values()) o[v]++;
    return o;
  });
  const yMax = Math.max(4, ...sev.flatMap((o) => [o.strong, o.weak, o.info]));

  // Top triggered indicators
  const sigCount = new Map<string, { title: string; n: number }>();
  for (const r of reports) {
    for (const id of new Set(r.signals.map((s) => s.id))) {
      const s = r.signals.find((x) => x.id === id)!;
      const e = sigCount.get(id) ?? { title: pick(s.title, lang), n: 0 };
      e.n++;
      sigCount.set(id, e);
    }
  }
  const rank = [...sigCount.values()].sort((a, b) => b.n - a.n).slice(0, 5).map((e) => ({ label: e.title, pct: Math.round((e.n / Math.max(1, n)) * 100) }));

  const alerts: AlertRow[] = reports.filter(isFlagged).slice(0, 5).map((r) => {
    const u = r.urls.find((x) => x.signals.length > 0 && x.parsed);
    return {
      id: r.reportId, reportId: r.reportId, risk: r.classification.risk === "high" ? "high" : "medium", icon: iconFor(r),
      title: pick(CATEGORY_LABEL[r.classification.category], lang),
      line2: u?.parsed?.registrableDomain ?? u?.parsed?.hostname ?? (r.input.type === "image" ? (lang === "hi" ? "स्क्रीनशॉट" : "Screenshot") : lang === "hi" ? "संदेश" : "Message"),
      line3: pick(r.classification.headline, lang),
      at: r.generatedAt,
    };
  });

  const detections: DetectionRow[] = reports.slice(0, 6).map((r, i) => ({
    time: clock(at[i] ?? r.generatedAt),
    target: r.input.displayText ? r.input.displayText.replace(/\s+/g, " ").slice(0, 44) : lang === "hi" ? "(स्क्रीनशॉट)" : "(screenshot)",
    type: pick(CATEGORY_LABEL[r.classification.category], lang),
    risk: r.classification.risk,
    desc: pick(r.classification.headline, lang),
    reportId: r.reportId,
  }));

  const topCat = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const topSig = [...sigCount.values()].sort((a, b) => b.n - a.n)[0];
  const highN = reports.filter((r) => r.classification.risk === "high").length;
  const insights: Insight[] = [
    { icon: "up", big: `${highN}/${n}`, text: lang === "hi" ? "जाँचें उच्च जोखिम की थीं" : "investigations were High risk" },
    { icon: "bulb", big: topCat ? BUCKETS.find((b) => b.key === topCat[0])!.label[lang] : "—", text: lang === "hi" ? "सबसे आम श्रेणी" : "most common category" },
    { icon: "shield", big: String(sigCount.size), text: topSig ? (lang === "hi" ? `अलग संकेत मिले; सबसे आम: ${topSig.title}` : `distinct indicators; most common: ${topSig.title}`) : lang === "hi" ? "अलग संकेत मिले" : "distinct indicators found" },
  ];

  return {
    mode: "session",
    kpis: [
      { key: "threats", label: KPI_LABELS.threats, value: String(last(thr)), sub, spark: pad(thr), color: "#ef4444" },
      { key: "urls", label: KPI_LABELS.urls, value: String(last(url)), sub, spark: pad(url), color: "#22c55e" },
      { key: "scams", label: KPI_LABELS.scams, value: String(last(scam)), sub, spark: pad(scam), color: "#3b82f6" },
      { key: "imp", label: KPI_LABELS.imp, value: String(last(imp)), sub, spark: pad(imp), color: "#a855f7" },
    ],
    donut: { segments, total: donutTotal },
    line: {
      title: lang === "hi" ? "संकेत गतिविधि" : "Indicator activity",
      xLabels: recent.map((_, i) => `#${i + 1}`),
      yMax,
      series: [
        { label: lang === "hi" ? "मज़बूत" : "Strong", color: "#ef4444", values: sev.map((o) => o.strong) },
        { label: lang === "hi" ? "चेतावनी" : "Warning", color: "#f59e0b", values: sev.map((o) => o.weak) },
        { label: lang === "hi" ? "टिप्पणी" : "Note", color: "#3b82f6", values: sev.map((o) => o.info) },
      ],
    },
    ranks: { title: lang === "hi" ? "सबसे अधिक मिले संकेत" : "Top triggered indicators", rows: rank },
    alerts,
    detections,
    insights,
    insightsNote: lang === "hi" ? "आपके सत्र से" : "From your session",
    gauge: { value: n, flagged: flagged.length },
  };
}
