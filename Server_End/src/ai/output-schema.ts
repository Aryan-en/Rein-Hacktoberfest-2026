import { z } from "zod";
import type { ModelFindings } from "../types/ai";

export const CATEGORIES = [
  "phishing", "advance_fee", "job_scam", "impersonation", "payment_fraud", "prize_lottery",
  "tech_support", "investment_scam", "romance_or_relationship", "malware_delivery",
  "other_suspicious", "no_clear_threat", "insufficient_information",
] as const;

export const TECHNIQUES = [
  "urgency", "authority_impersonation", "fear_threat", "reward_bait", "credential_harvesting",
  "payment_pressure", "secrecy_isolation", "off_platform_migration", "trust_building", "other",
] as const;

const text = (max: number) => z.string().transform((s) => s.trim().slice(0, max));

const Localized = z.object({
  en: text(900).pipe(z.string().min(1)),
  // Missing Hindi degrades to "" and the UI falls back to English; never machine-translated silently.
  hi: z.string().optional().default("").transform((s) => s.trim().slice(0, 1400)),
});

/** Keep valid items, drop malformed ones, cap length. */
const lenientArray = <T extends z.ZodTypeAny>(item: T, max: number) =>
  z.array(z.unknown()).default([]).transform((arr) => {
    const out: z.infer<T>[] = [];
    for (const v of arr) {
      const r = item.safeParse(v);
      if (r.success) out.push(r.data);
      if (out.length >= max) break;
    }
    return out;
  });

export const ModelFindingsSchema = z.object({
  schemaVersion: z.number().optional(),
  category: z.enum(CATEGORIES).catch("other_suspicious"),
  aiRisk: z.enum(["low", "medium", "high", "unknown"]).catch("unknown"),
  summary: Localized,
  manipulationTechniques: lenientArray(
    z.object({ id: z.enum(TECHNIQUES).catch("other"), explanation: Localized }),
    8,
  ),
  evidence: lenientArray(
    z.object({
      quote: text(500).pipe(z.string().min(3)),
      why: Localized,
      technique: z.enum(TECHNIQUES).optional().catch(undefined),
    }),
    10,
  ),
  extractedText: z.string().optional().transform((s) => (s === undefined ? undefined : s.slice(0, 12_000))),
  uncertainties: lenientArray(Localized, 6),
  injectionAttemptDetected: z.boolean().optional().default(false).catch(false),
});

export function toFindings(v: z.infer<typeof ModelFindingsSchema>): ModelFindings {
  return {
    schemaVersion: 1,
    category: v.category,
    aiRisk: v.aiRisk,
    summary: v.summary,
    manipulationTechniques: v.manipulationTechniques,
    evidence: v.evidence.map((e) => ({ quote: e.quote, why: e.why, ...(e.technique ? { technique: e.technique } : {}) })),
    ...(v.extractedText !== undefined ? { extractedText: v.extractedText } : {}),
    uncertainties: v.uncertainties,
    injectionAttemptDetected: v.injectionAttemptDetected,
  };
}
