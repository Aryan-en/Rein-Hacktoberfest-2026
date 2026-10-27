import { describe, expect, it } from "vitest";
import { classify, deterministicFloor } from "../../../src/analysis/classify";
import { makeSignal } from "../../../src/security/messages";
import type { ModelFindings } from "../../../src/types/ai";

const sig = (...ids: string[]) => ids.map((id) => makeSignal(id));
const f = (aiRisk: ModelFindings["aiRisk"], category: ModelFindings["category"] = "phishing"): ModelFindings => ({
  schemaVersion: 1, category, aiRisk, summary: { en: "s", hi: "s" }, manipulationTechniques: [], evidence: [], uncertainties: [], injectionAttemptDetected: false,
});
const run = (signals: ReturnType<typeof sig>, findings: ModelFindings | null, verified = 0, insufficient = false) =>
  classify({ signals, findings, verifiedEvidenceCount: verified, insufficientInput: insufficient });

describe("deterministicFloor", () => {
  it("none / low / medium / high branches", () => {
    expect(deterministicFloor([])).toBe("none");
    expect(deterministicFloor(sig("text_urgency"))).toBe("low");
    expect(deterministicFloor(sig("text_urgency", "text_threat"))).toBe("medium");
    expect(deterministicFloor(sig("text_credential_request"))).toBe("medium");
    expect(deterministicFloor(sig("text_credential_request", "text_urgency"))).toBe("high");
    expect(deterministicFloor(sig("text_credential_request", "text_advance_fee"))).toBe("high");
  });
  it("counts distinct signal IDs, not repeated matches", () => {
    expect(deterministicFloor([...sig("text_urgency"), ...sig("text_urgency"), ...sig("text_urgency")])).toBe("low");
  });
  it("info signals do not count", () => {
    expect(deterministicFloor(sig("prompt_injection_attempt", "url_long_or_hex_path"))).toBe("none");
  });
});

describe("classify: AI reconciliation", () => {
  it("AI high with a verified quote reaches High", () => {
    expect(run([], f("high"), 1).risk).toBe("high");
  });
  it("AI high WITHOUT a verified quote is capped at Medium", () => {
    const c = run([], f("high"), 0);
    expect(c.risk).toBe("medium");
    expect(c.rationale.some((r) => r.basis === "ai_unverified_capped")).toBe(true);
  });
  it("AI medium without verified quote is Low", () => {
    expect(run([], f("medium"), 0).risk).toBe("low");
  });
  it("AI low cannot lower the deterministic floor (model_disagreement)", () => {
    const c = run(sig("text_credential_request", "text_urgency"), f("low", "no_clear_threat"), 0);
    expect(c.risk).toBe("high");
    expect(c.rationale.some((r) => r.basis === "model_disagreement")).toBe(true);
  });
  it("hijacked 'safe' verdict has no effect when strong signals exist", () => {
    expect(run(sig("url_ip_host", "text_credential_request"), f("low", "no_clear_threat")).risk).toBe("high");
  });
  it("AI unknown with no signals is Unknown, not Low", () => {
    expect(run([], f("unknown", "insufficient_information")).risk).toBe("unknown");
  });
  it("benign: AI low, no signals => Low", () => {
    const c = run([], f("low", "no_clear_threat"));
    expect(c.risk).toBe("low");
    expect(c.category).toBe("no_clear_threat");
  });
  it("floor and AI combine by max", () => {
    expect(run(sig("text_urgency"), f("medium"), 1).risk).toBe("medium");
  });
});

describe("classify: degraded and insufficient", () => {
  it("deterministic_only with no signals is Unknown (never Low)", () => {
    const c = run([], null);
    expect(c.risk).toBe("unknown");
    expect(c.category).toBe("insufficient_information");
  });
  it("deterministic_only with strong signals still classifies", () => {
    const c = run(sig("text_credential_request", "text_urgency"), null);
    expect(c.risk).toBe("high");
    expect(c.category).toBe("phishing");
  });
  it("insufficient input is Unknown even if AI says low", () => {
    expect(run([], f("low", "no_clear_threat"), 0, true).risk).toBe("unknown");
  });
  it("insufficient input with strong signals is still classified", () => {
    expect(run(sig("url_ip_host", "url_userinfo"), null, 0, true).risk).toBe("high");
  });
  it("uses deterministic category when AI says no_clear_threat but rules are Medium+", () => {
    expect(run(sig("text_advance_fee", "text_urgency"), f("low", "no_clear_threat")).category).toBe("advance_fee");
  });
  it("headlines are bilingual and never contain numbers/percentages", () => {
    for (const c of [run(sig("text_credential_request", "text_urgency"), null), run([], null), run([], f("low", "no_clear_threat"))]) {
      expect(c.headline.en.length).toBeGreaterThan(5);
      expect(c.headline.hi.length).toBeGreaterThan(5);
      expect(JSON.stringify(c)).not.toMatch(/\d+\s?%|confidence|probability|score/i);
    }
  });
  it("Low headline never says safe", () => {
    expect(run([], f("low", "no_clear_threat")).headline.en.toLowerCase()).not.toMatch(/\bsafe\b/);
  });
});
