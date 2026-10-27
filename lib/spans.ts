import type { EvidenceItem, Severity } from "./types";

export interface Segment {
  text: string;
  evidenceIds: string[];
  severity: Severity | null;
}

const RANK: Record<Severity, number> = { info: 0, weak: 1, strong: 2 };

/** Splits text into segments; overlapping evidence spans are merged by boundary, strongest severity wins. */
export function buildSegments(text: string, evidence: EvidenceItem[]): Segment[] {
  const spans = evidence.filter((e) => e.span && e.span[1] > e.span[0] && e.span[0] >= 0 && e.span[1] <= text.length);
  if (spans.length === 0) return [{ text, evidenceIds: [], severity: null }];
  const cuts = new Set<number>([0, text.length]);
  for (const e of spans) {
    cuts.add(e.span![0]);
    cuts.add(e.span![1]);
  }
  const points = [...cuts].sort((a, b) => a - b);
  const out: Segment[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i]!;
    const b = points[i + 1]!;
    if (a === b) continue;
    const cover = spans.filter((e) => e.span![0] <= a && e.span![1] >= b);
    const severity = cover.length ? cover.reduce<Severity>((m, e) => (RANK[e.severity] > RANK[m] ? e.severity : m), "info") : null;
    out.push({ text: text.slice(a, b), evidenceIds: cover.map((e) => e.id), severity });
  }
  return out;
}
