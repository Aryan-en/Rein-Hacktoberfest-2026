import type { LocalizedText, ManipulationTechnique, ThreatCategory } from "../types/investigation";

const L = (en: string, hi: string): LocalizedText => ({ en, hi });

export const CATEGORY_LABELS: Record<ThreatCategory, LocalizedText> = {
  phishing: L("phishing / credential theft", "फ़िशिंग / क्रेडेंशियल चोरी"),
  advance_fee: L("an advance-fee scam", "एडवांस-फ़ीस ठगी"),
  job_scam: L("a job scam", "नौकरी के नाम पर ठगी"),
  impersonation: L("impersonation", "किसी और का रूप धरना"),
  payment_fraud: L("payment fraud", "भुगतान धोखाधड़ी"),
  prize_lottery: L("a prize / lottery scam", "इनाम / लॉटरी ठगी"),
  tech_support: L("a tech-support scam", "टेक-सपोर्ट ठगी"),
  investment_scam: L("an investment scam", "निवेश ठगी"),
  romance_or_relationship: L("a romance / relationship scam", "रोमांस / रिश्तों की ठगी"),
  malware_delivery: L("malware delivery", "मैलवेयर फैलाना"),
  other_suspicious: L("suspicious activity", "संदिग्ध गतिविधि"),
  no_clear_threat: L("no clear threat", "कोई स्पष्ट खतरा नहीं"),
  insufficient_information: L("insufficient information", "अपर्याप्त जानकारी"),
};

export const TECHNIQUE_LABELS: Record<ManipulationTechnique, LocalizedText> = {
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
