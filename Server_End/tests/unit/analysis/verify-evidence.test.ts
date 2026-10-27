import { describe, expect, it } from "vitest";
import { locateQuote, signalsToEvidence, verifyAiEvidence } from "../../../src/analysis/verify-evidence";
import { makeSignal } from "../../../src/security/messages";
import type { ModelFindings } from "../../../src/types/ai";

const TEXT = "Dear user,\nYour  SBI account will be BLOCKED.\nShare OTP now";

describe("locateQuote", () => {
  it("finds exact quotes and returns correct span", () => {
    const r = locateQuote(TEXT, "Share OTP now");
    expect(r.found).toBe(true);
    expect(TEXT.slice(...r.span!)).toBe("Share OTP now");
  });
  it("ignores case and whitespace differences", () => {
    const r = locateQuote(TEXT, "your sbi account will be blocked");
    expect(r.found).toBe(true);
    expect(TEXT.slice(...r.span!).replace(/\s+/g, " ")).toBe("Your SBI account will be BLOCKED");
  });
  it("rejects fabricated quotes", () => {
    expect(locateQuote(TEXT, "Send your Aadhaar number").found).toBe(false);
  });
  it("rejects too-short quotes", () => {
    expect(locateQuote(TEXT, "a").found).toBe(false);
  });
});

const findings = (quotes: string[], aiRisk: ModelFindings["aiRisk"] = "high"): ModelFindings => ({
  schemaVersion: 1, category: "phishing", aiRisk, summary: { en: "s", hi: "s" }, manipulationTechniques: [], uncertainties: [], injectionAttemptDetected: false,
  evidence: quotes.map((q) => ({ quote: q, why: { en: "w", hi: "w" } })),
});

describe("verifyAiEvidence", () => {
  it("marks real quotes verified and fabricated ones unverified (kept, info severity)", () => {
    const r = verifyAiEvidence(findings(["Share OTP now", "Transfer 5000 rupees"]), TEXT, "input");
    expect(r.verifiedCount).toBe(1);
    const fake = r.items.find((i) => i.quote === "Transfer 5000 rupees")!;
    expect(fake.quoteVerified).toBe(false);
    expect(fake.span).toBeNull();
    expect(fake.severity).toBe("info");
    expect(fake.provenance).toBe("ai_interpretation");
  });
  it("dedupes repeated quotes", () => {
    expect(verifyAiEvidence(findings(["Share OTP now", "share  otp NOW"]), TEXT, "input").items).toHaveLength(1);
  });
  it("returns nothing when findings are null", () => {
    expect(verifyAiEvidence(null, TEXT, "input")).toEqual({ items: [], verifiedCount: 0 });
  });
  it("tags source for OCR", () => {
    expect(verifyAiEvidence(findings(["Share OTP now"]), TEXT, "ocr").items[0]!.source).toBe("ocr");
  });
});

describe("signalsToEvidence", () => {
  it("maps provenance from signal class and keeps spans", () => {
    const ev = signalsToEvidence([
      makeSignal("url_ip_host", { matched: "http://1.2.3.4", span: [0, 14] }),
      makeSignal("text_urgency", { matched: "now", span: [5, 8] }),
      makeSignal("hidden_characters"),
    ]);
    expect(ev.map((e) => e.provenance)).toEqual(["observed", "heuristic", "observed"]);
    expect(ev[0]!.quoteVerified).toBe(true);
    expect(ev[2]!.quoteVerified).toBe(false);
  });
});
