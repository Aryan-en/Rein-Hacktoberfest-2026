import { foldForMatching } from "../security/normalize";
import type { ModelFindings } from "../types/ai";
import type { EvidenceItem, InputSource, Signal } from "../types/investigation";
import { TECHNIQUE_LABELS } from "./labels";

export interface LocatedQuote {
  found: boolean;
  span: [number, number] | null;
}

/**
 * Deterministic check that a model-supplied quote exists verbatim (ignoring case and whitespace
 * differences) in the source text. This verifies PRESENCE only, never the truth of the model's claim.
 */
export function locateQuote(text: string, quote: string): LocatedQuote {
  const q = foldForMatching(quote.normalize("NFKC")).folded.trim();
  if (q.length < 3) return { found: false, span: null };
  const { folded, map } = foldForMatching(text);
  const idx = folded.indexOf(q);
  if (idx < 0) return { found: false, span: null };
  const start = map[idx]!;
  const end = map[idx + q.length - 1]! + 1;
  return { found: true, span: [start, end] };
}

export function signalsToEvidence(signals: Signal[]): EvidenceItem[] {
  return signals.slice(0, 24).map((s, i) => ({
    id: `sig-${i + 1}`,
    provenance: s.class === "observed" ? "observed" : "heuristic",
    severity: s.severity,
    title: s.title,
    explanation: s.detail,
    quote: s.matched ?? null,
    // The matched text came from deterministic code operating on this very text, so its location is known.
    quoteVerified: s.span != null,
    span: s.span ?? null,
    source: s.source,
    signalId: s.id,
  }));
}

export interface AiEvidenceResult {
  items: EvidenceItem[];
  verifiedCount: number;
}

export function verifyAiEvidence(findings: ModelFindings | null, text: string, source: InputSource): AiEvidenceResult {
  if (!findings) return { items: [], verifiedCount: 0 };
  const items: EvidenceItem[] = [];
  const seen = new Set<string>();
  let verifiedCount = 0;
  findings.evidence.forEach((e, i) => {
    const key = e.quote.toLowerCase().replace(/\s+/g, " ");
    if (seen.has(key)) return;
    seen.add(key);
    const loc = locateQuote(text, e.quote);
    if (loc.found) verifiedCount++;
    const severity = !loc.found ? "info" : findings.aiRisk === "high" ? "strong" : findings.aiRisk === "medium" ? "weak" : "info";
    items.push({
      id: `ai-${i + 1}`,
      provenance: "ai_interpretation",
      severity,
      title: e.technique ? TECHNIQUE_LABELS[e.technique] : { en: "Phrase flagged by AI", hi: "AI द्वारा चिह्नित वाक्यांश" },
      explanation: e.why,
      quote: e.quote,
      quoteVerified: loc.found,
      span: loc.span,
      source,
    });
  });
  return { items, verifiedCount };
}
