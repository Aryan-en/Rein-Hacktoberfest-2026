// Mirror of the backend report contract (Server_End/src/types/investigation.ts, context/Architecture.md §7).
// Kept as a copy so the web app builds independently of the backend folder.

export interface LocalizedText {
  en: string;
  hi: string;
}
export type Lang = "en" | "hi";
export type RiskLevel = "low" | "medium" | "high" | "unknown";
export type ThreatCategory =
  | "phishing" | "advance_fee" | "job_scam" | "impersonation" | "payment_fraud" | "prize_lottery"
  | "tech_support" | "investment_scam" | "romance_or_relationship" | "malware_delivery"
  | "other_suspicious" | "no_clear_threat" | "insufficient_information";
export type ManipulationTechnique =
  | "urgency" | "authority_impersonation" | "fear_threat" | "reward_bait" | "credential_harvesting"
  | "payment_pressure" | "secrecy_isolation" | "off_platform_migration" | "trust_building" | "other";
export type Severity = "info" | "weak" | "strong";
export type InputSource = "input" | "ocr";

export interface Signal {
  id: string;
  class: "observed" | "heuristic";
  severity: Severity;
  title: LocalizedText;
  detail: LocalizedText;
  matched?: string;
  span?: [number, number] | null;
  source: InputSource;
}

export interface UrlAnalysis {
  raw: string;
  normalized: string | null;
  parsed: null | {
    protocol: string;
    hostname: string;
    unicodeHostname: string;
    registrableDomain: string | null;
    subdomain: string | null;
    publicSuffix: string | null;
    port: string | null;
    path: string;
    query: string;
    hasUserinfo: boolean;
    isIp: boolean;
    labelCount: number;
  };
  signals: Signal[];
}

export type RationaleBasis = "deterministic" | "ai_verified" | "ai_unverified_capped" | "insufficient_input" | "model_disagreement";

export interface EvidenceItem {
  id: string;
  provenance: "observed" | "heuristic" | "ai_interpretation";
  severity: Severity;
  title: LocalizedText;
  explanation: LocalizedText;
  quote: string | null;
  quoteVerified: boolean;
  span: [number, number] | null;
  source: InputSource;
  signalId?: string;
}

export interface ModelDisclosure {
  mode: "ai_assisted" | "deterministic_only";
  requestedModel: string;
  usedModel: string | null;
  attempts: Array<{ model: string; outcome: string; latencyMs: number }>;
  fellBack: boolean;
  degradedReason?: string;
}

export interface InvestigationReport {
  schemaVersion: 1;
  reportId: string;
  generatedAt: string;
  input: {
    type: "text" | "url" | "image";
    displayText: string;
    textSource: "user" | "ocr";
    charCount: number;
    truncated: boolean;
    hiddenCharactersRemoved: boolean;
  };
  classification: {
    risk: RiskLevel;
    category: ThreatCategory;
    headline: LocalizedText;
    rationale: Array<{ text: LocalizedText; basis: RationaleBasis }>;
  };
  signals: Signal[];
  urls: UrlAnalysis[];
  evidence: EvidenceItem[];
  manipulationTechniques: Array<{ id: ManipulationTechnique; explanation: LocalizedText; provenance: "ai_interpretation" }>;
  explanation: { summary: LocalizedText } | null;
  recommendations: Array<{ id: string; priority: "now" | "soon" | "info"; text: LocalizedText }>;
  limitations: LocalizedText[];
  uncertainties: LocalizedText[];
  model: ModelDisclosure;
  timings: { totalMs: number; modelMs: number | null };
}

export type AnalyzeRequest =
  | { inputType: "text"; text: string }
  | { inputType: "url"; url: string }
  | { inputType: "image"; image: { mimeType: "image/png" | "image/jpeg" | "image/webp"; dataBase64: string }; note?: string };

export interface HealthInfo {
  status: string;
  version: string;
  ai: "configured" | "missing_key";
  models: { primary: string; fallback: string | null; vision: string | null };
  screenshot: "enabled" | "disabled";
  auth?: "enabled";
}

export const LIMITS = {
  maxText: 8000,
  maxUrl: 2048,
  maxImageBytes: 4 * 1024 * 1024,
  maxNote: 500,
  imageTypes: ["image/png", "image/jpeg", "image/webp"] as const,
};

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
