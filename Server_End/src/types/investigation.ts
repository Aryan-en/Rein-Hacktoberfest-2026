// Shared report contract. Mirrors context/Architecture.md §4.5 and §7.

export interface LocalizedText {
  en: string;
  hi: string;
}

export type RiskLevel = "low" | "medium" | "high" | "unknown";

export type ThreatCategory =
  | "phishing"
  | "advance_fee"
  | "job_scam"
  | "impersonation"
  | "payment_fraud"
  | "prize_lottery"
  | "tech_support"
  | "investment_scam"
  | "romance_or_relationship"
  | "malware_delivery"
  | "other_suspicious"
  | "no_clear_threat"
  | "insufficient_information";

export type ManipulationTechnique =
  | "urgency"
  | "authority_impersonation"
  | "fear_threat"
  | "reward_bait"
  | "credential_harvesting"
  | "payment_pressure"
  | "secrecy_isolation"
  | "off_platform_migration"
  | "trust_building"
  | "other";

export type SignalClass = "observed" | "heuristic";
export type Severity = "info" | "weak" | "strong";
export type InputSource = "input" | "ocr";

export interface Signal {
  id: string;
  class: SignalClass;
  severity: Severity;
  title: LocalizedText;
  detail: LocalizedText;
  matched?: string;
  /** Offsets into the report's input.displayText. */
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

export type RationaleBasis =
  | "deterministic"
  | "ai_verified"
  | "ai_unverified_capped"
  | "insufficient_input"
  | "model_disagreement";

export interface EvidenceItem {
  id: string;
  provenance: "observed" | "heuristic" | "ai_interpretation";
  severity: Severity;
  title: LocalizedText;
  explanation: LocalizedText;
  quote: string | null;
  /** Deterministic substring check only. Does NOT validate the truth of the claim. */
  quoteVerified: boolean;
  span: [number, number] | null;
  source: InputSource;
  signalId?: string;
}

export interface ModelAttempt {
  model: string;
  outcome: "ok" | "timeout" | "rate_limited" | "invalid_output" | "error" | "blocked";
  latencyMs: number;
}

export interface ModelDisclosure {
  mode: "ai_assisted" | "deterministic_only";
  requestedModel: string;
  usedModel: string | null;
  attempts: ModelAttempt[];
  fellBack: boolean;
  degradedReason?: string;
}

export interface Classification {
  risk: RiskLevel;
  category: ThreatCategory;
  headline: LocalizedText;
  rationale: Array<{ text: LocalizedText; basis: RationaleBasis }>;
}

export interface Recommendation {
  id: string;
  priority: "now" | "soon" | "info";
  text: LocalizedText;
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
  classification: Classification;
  signals: Signal[];
  urls: UrlAnalysis[];
  evidence: EvidenceItem[];
  manipulationTechniques: Array<{
    id: ManipulationTechnique;
    explanation: LocalizedText;
    provenance: "ai_interpretation";
  }>;
  explanation: { summary: LocalizedText } | null;
  recommendations: Recommendation[];
  limitations: LocalizedText[];
  uncertainties: LocalizedText[];
  model: ModelDisclosure;
  timings: { totalMs: number; modelMs: number | null };
}

export type ApiErrorCode =
  | "invalid_request"
  | "payload_too_large"
  | "unsupported_media_type"
  | "unreadable_image"
  | "rate_limited"
  | "service_unavailable"
  | "image_analysis_unavailable"
  | "internal_error"
  | "not_found"
  | "method_not_allowed"
  | "invalid_credentials"
  | "email_taken"
  | "too_many_attempts"
  | "unauthorized";

export interface ApiError {
  error: {
    code: ApiErrorCode;
    message: string;
    requestId: string;
    retryAfterSeconds?: number;
    fieldErrors?: Record<string, string[]>;
  };
}
