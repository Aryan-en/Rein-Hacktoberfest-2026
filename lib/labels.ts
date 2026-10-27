import type { LocalizedText, ManipulationTechnique, RationaleBasis, RiskLevel, ThreatCategory } from "./types";

const L = (en: string, hi: string): LocalizedText => ({ en, hi });

export const RISK_LABEL: Record<RiskLevel, LocalizedText> = {
  high: L("High risk", "उच्च जोखिम"),
  medium: L("Medium risk", "मध्यम जोखिम"),
  low: L("Low risk", "कम जोखिम"),
  unknown: L("Unknown", "अज्ञात"),
};

export const CATEGORY_LABEL: Record<ThreatCategory, LocalizedText> = {
  phishing: L("Phishing / Credential theft", "फ़िशिंग / क्रेडेंशियल चोरी"),
  advance_fee: L("Advance-fee scam", "एडवांस-फ़ीस ठगी"),
  job_scam: L("Job scam", "नौकरी ठगी"),
  impersonation: L("Impersonation", "रूप धरना"),
  payment_fraud: L("Payment fraud", "भुगतान धोखाधड़ी"),
  prize_lottery: L("Prize / Lottery scam", "इनाम / लॉटरी ठगी"),
  tech_support: L("Tech-support scam", "टेक-सपोर्ट ठगी"),
  investment_scam: L("Investment scam", "निवेश ठगी"),
  romance_or_relationship: L("Romance scam", "रोमांस ठगी"),
  malware_delivery: L("Malware delivery", "मैलवेयर"),
  other_suspicious: L("Suspicious activity", "संदिग्ध गतिविधि"),
  no_clear_threat: L("No clear threat", "कोई स्पष्ट खतरा नहीं"),
  insufficient_information: L("Insufficient information", "अपर्याप्त जानकारी"),
};

export const TECHNIQUE_LABEL: Record<ManipulationTechnique, LocalizedText> = {
  urgency: L("Urgency", "जल्दबाज़ी"),
  authority_impersonation: L("Authority impersonation", "अधिकारी बनने का नाटक"),
  fear_threat: L("Fear / threat", "डर / धमकी"),
  reward_bait: L("Reward bait", "इनाम का लालच"),
  credential_harvesting: L("Credential harvesting", "गोपनीय जानकारी हथियाना"),
  payment_pressure: L("Payment pressure", "भुगतान का दबाव"),
  secrecy_isolation: L("Secrecy / isolation", "गोपनीयता / अलग-थलग करना"),
  off_platform_migration: L("Moving off-platform", "दूसरे प्लेटफ़ॉर्म पर ले जाना"),
  trust_building: L("Trust building", "भरोसा बनाना"),
  other: L("Other tactic", "अन्य तरीका"),
};

export const BASIS_LABEL: Record<RationaleBasis, LocalizedText> = {
  deterministic: L("From rules", "नियमों से"),
  ai_verified: L("AI + verified quote", "AI + सत्यापित उद्धरण"),
  ai_unverified_capped: L("AI, unverified (capped)", "AI, असत्यापित (सीमित)"),
  insufficient_input: L("Insufficient input", "अपर्याप्त इनपुट"),
  model_disagreement: L("Model disagreed", "मॉडल असहमत"),
};

export const RISK_STYLE: Record<RiskLevel, { text: string; border: string; bg: string; glow: string; dot: string }> = {
  high: { text: "text-high", border: "border-high/40", bg: "bg-high/10", glow: "shadow-[0_12px_40px_-20px_rgba(239,68,68,0.55)]", dot: "bg-high" },
  medium: { text: "text-medium", border: "border-medium/40", bg: "bg-medium/10", glow: "shadow-[0_12px_40px_-20px_rgba(245,158,11,0.5)]", dot: "bg-medium" },
  low: { text: "text-low", border: "border-low/40", bg: "bg-low/10", glow: "shadow-[0_12px_40px_-20px_rgba(34,197,94,0.45)]", dot: "bg-low" },
  unknown: { text: "text-muted", border: "border-line-strong", bg: "bg-surface-2", glow: "", dot: "bg-muted" },
};
