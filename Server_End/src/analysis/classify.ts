import type { ModelFindings } from "../types/ai";
import type { Classification, LocalizedText, RationaleBasis, RiskLevel, Signal, ThreatCategory } from "../types/investigation";
import { CATEGORY_LABELS } from "./labels";

type Level = "none" | "low" | "medium" | "high";
const ORDER: Record<Level, number> = { none: 0, low: 1, medium: 2, high: 3 };
const maxLevel = (a: Level, b: Level): Level => (ORDER[a] >= ORDER[b] ? a : b);

export interface ClassifyInput {
  signals: Signal[];
  findings: ModelFindings | null;
  verifiedEvidenceCount: number;
  insufficientInput: boolean;
}

export function deterministicFloor(signals: Signal[]): Level {
  const strong = new Set(signals.filter((s) => s.severity === "strong").map((s) => s.id));
  const weak = new Set(signals.filter((s) => s.severity === "weak").map((s) => s.id));
  if (strong.size >= 2) return "high";
  if (strong.size === 1 && weak.size >= 1) return "high";
  if (strong.size === 1) return "medium";
  if (weak.size >= 2) return "medium";
  if (weak.size === 1) return "low";
  return "none";
}

export function aiEffective(findings: ModelFindings | null, verified: number): { level: Level; capped: boolean } {
  if (!findings || findings.category === "insufficient_information") return { level: "none", capped: false };
  switch (findings.aiRisk) {
    case "high":
      return verified >= 1 ? { level: "high", capped: false } : { level: "medium", capped: true };
    case "medium":
      return { level: verified >= 1 ? "medium" : "low", capped: verified < 1 };
    case "low":
      return { level: "low", capped: false };
    default:
      return { level: "none", capped: false };
  }
}

/** Category implied by deterministic signals alone (used when the model is absent or says "no threat"). */
export function deterministicCategory(signals: Signal[]): ThreatCategory | null {
  const ids = new Set(signals.map((s) => s.id));
  if (ids.has("text_remote_access")) return "tech_support";
  if (ids.has("text_advance_fee")) return "advance_fee";
  if (ids.has("text_credential_request") || ids.has("url_brand_mismatch") || ids.has("url_lookalike_domain") || ids.has("url_deceptive_subdomain")) return "phishing";
  if (ids.has("text_prize_bait")) return "prize_lottery";
  if (ids.has("text_payment_request")) return "payment_fraud";
  if (ids.has("text_authority_claim")) return "impersonation";
  if (signals.some((s) => s.severity !== "info")) return "other_suspicious";
  return null;
}

const L = (en: string, hi: string): LocalizedText => ({ en, hi });
const join = (xs: LocalizedText[]): LocalizedText => ({ en: xs.map((x) => x.en).join("; "), hi: xs.map((x) => x.hi).join("; ") });

function headline(risk: RiskLevel, category: ThreatCategory): LocalizedText {
  const c = CATEGORY_LABELS[category];
  switch (risk) {
    case "high": return L(`High risk: likely ${c.en}`, `उच्च जोखिम: ${c.hi} की संभावना`);
    case "medium": return L(`Medium risk: warning signs of ${c.en}`, `मध्यम जोखिम: ${c.hi} के चेतावनी संकेत`);
    case "low": return L("Low risk: no strong scam indicators found", "कम जोखिम: ठगी के कोई मज़बूत संकेत नहीं मिले");
    default: return L("Unknown: not enough information to classify", "अज्ञात: वर्गीकरण के लिए पर्याप्त जानकारी नहीं");
  }
}

/** Pure, deterministic classification (Architecture §6.2). No numeric scores. */
export function classify(input: ClassifyInput): Classification {
  const { signals, findings } = input;
  const rationale: Classification["rationale"] = [];
  const push = (text: LocalizedText, basis: RationaleBasis) => rationale.push({ text, basis });

  const floor = deterministicFloor(signals);
  const ai = aiEffective(findings, input.verifiedEvidenceCount);

  const strongTitles = [...new Map(signals.filter((s) => s.severity === "strong").map((s) => [s.id, s.title])).values()];
  const weakTitles = [...new Map(signals.filter((s) => s.severity === "weak").map((s) => [s.id, s.title])).values()];
  if (strongTitles.length) push(L(`Strong indicators found by rule-based checks: ${join(strongTitles).en}.`, `नियम-आधारित जाँच में मज़बूत संकेत मिले: ${join(strongTitles).hi}।`), "deterministic");
  if (weakTitles.length) push(L(`Additional warning signs: ${join(weakTitles).en}.`, `अन्य चेतावनी संकेत: ${join(weakTitles).hi}।`), "deterministic");

  if (findings) {
    if (findings.aiRisk === "high" && !ai.capped) push(L("The AI model assessed this as high risk and its supporting quotes were found in the content.", "AI मॉडल ने इसे उच्च जोखिम माना और उसके उद्धरण सामग्री में मिले।"), "ai_verified");
    else if (findings.aiRisk === "high" && ai.capped) push(L("The AI model assessed this as high risk, but none of its quotes could be found in the content, so the rating was capped at Medium.", "AI मॉडल ने इसे उच्च जोखिम माना, पर उसका कोई उद्धरण सामग्री में नहीं मिला, इसलिए रेटिंग मध्यम तक सीमित की गई।"), "ai_unverified_capped");
    else if (findings.aiRisk === "medium" && !ai.capped) push(L("The AI model found warning signs and its supporting quotes were found in the content.", "AI मॉडल को चेतावनी संकेत मिले और उसके उद्धरण सामग्री में मिले।"), "ai_verified");
    else if (findings.aiRisk === "medium") push(L("The AI model suspected a problem but gave no quotes that could be found in the content, so it was given little weight.", "AI मॉडल को संदेह था पर उसके उद्धरण सामग्री में नहीं मिले, इसलिए उसे कम महत्व दिया गया।"), "ai_unverified_capped");
    if (ORDER[ai.level] < ORDER[floor]) push(L("The AI model rated this lower than the rule-based checks. The higher rule-based rating was kept.", "AI मॉडल ने नियम-आधारित जाँच से कम जोखिम बताया। नियम-आधारित उच्च रेटिंग रखी गई।"), "model_disagreement");
  }

  let level = maxLevel(floor, ai.level);
  let risk: RiskLevel;
  if (level === "none") {
    risk = "unknown";
    if (input.insufficientInput) push(L("The content is too short or unreadable to classify.", "सामग्री वर्गीकरण के लिए बहुत छोटी या अपठनीय है।"), "insufficient_input");
    else if (!findings) push(L("No indicators were found, but AI analysis was unavailable, so this cannot be rated Low.", "कोई संकेत नहीं मिला, पर AI विश्लेषण उपलब्ध नहीं था, इसलिए इसे कम जोखिम नहीं कहा जा सकता।"), "insufficient_input");
    else push(L("Neither the rule-based checks nor the AI model could reach a conclusion.", "न नियम-आधारित जाँच और न AI मॉडल किसी निष्कर्ष पर पहुँच सका।"), "insufficient_input");
  } else if (input.insufficientInput && floor === "none") {
    level = "none";
    risk = "unknown";
  } else {
    risk = level;
  }

  let category: ThreatCategory;
  const detCat = deterministicCategory(signals);
  if (risk === "unknown") category = "insufficient_information";
  else if (findings && findings.category !== "no_clear_threat" && findings.category !== "insufficient_information") category = findings.category;
  else if (detCat && ORDER[floor] >= ORDER.medium) category = detCat;
  else if (findings && findings.category === "no_clear_threat" && risk === "low") category = "no_clear_threat";
  else category = detCat ?? (risk === "low" ? "no_clear_threat" : "other_suspicious");

  return { risk, category, headline: headline(risk, category), rationale };
}
