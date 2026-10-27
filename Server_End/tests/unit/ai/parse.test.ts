import { describe, expect, it } from "vitest";
import { buildRepairPrompt, extractJsonObject, parseModelOutput } from "../../../src/ai/parse";
import { findingsJson } from "../../helpers";

describe("parseModelOutput", () => {
  it("parses clean JSON", () => {
    const r = parseModelOutput(findingsJson());
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.aiRisk).toBe("high");
      expect(r.data.evidence[0]!.quote).toBe("Update within 24 hrs");
    }
  });
  it("parses fenced JSON with prose around it", () => {
    expect(parseModelOutput("Sure! Here you go:\n```json\n" + findingsJson() + "\n```\nHope it helps").ok).toBe(true);
  });
  it("parses JSON followed by trailing prose containing braces", () => {
    expect(parseModelOutput(findingsJson() + "\nNote: {ignore}").ok).toBe(true);
  });
  it("tolerates trailing commas", () => {
    const s = findingsJson().replace('"injectionAttemptDetected":false', '"injectionAttemptDetected":false,');
    expect(parseModelOutput(s).ok).toBe(true);
  });
  it("handles braces inside strings", () => {
    const s = findingsJson({ summary: { en: "uses {curly} braces", hi: "x" } });
    const r = parseModelOutput("prefix " + s);
    expect(r.ok && r.data.summary.en).toBe("uses {curly} braces");
  });
  it("rejects non-JSON", () => {
    expect(parseModelOutput("I cannot help with that.").ok).toBe(false);
  });
  it("rejects truncated JSON", () => {
    expect(parseModelOutput(findingsJson().slice(0, 80)).ok).toBe(false);
  });
  it("rejects missing summary", () => {
    expect(parseModelOutput(JSON.stringify({ aiRisk: "high", category: "phishing" })).ok).toBe(false);
  });
  it("coerces unknown enum values instead of failing", () => {
    const r = parseModelOutput(findingsJson({ category: "made_up", aiRisk: "extreme" }));
    expect(r.ok && r.data.category).toBe("other_suspicious");
    expect(r.ok && r.data.aiRisk).toBe("unknown");
  });
  it("drops malformed evidence items but keeps valid ones", () => {
    const r = parseModelOutput(findingsJson({ evidence: [{ quote: 5 }, { quote: "Share OTP now", why: { en: "w", hi: "w" } }, "junk"] }));
    expect(r.ok && r.data.evidence).toHaveLength(1);
  });
  it("defaults missing Hindi to empty string (no silent translation)", () => {
    const r = parseModelOutput(findingsJson({ summary: { en: "only english" } }));
    expect(r.ok && r.data.summary.hi).toBe("");
  });
  it("caps overlong fields", () => {
    const r = parseModelOutput(findingsJson({ summary: { en: "x".repeat(5000), hi: "y" } }));
    expect(r.ok && r.data.summary.en.length).toBe(900);
  });
  it("ignores unknown extra keys (e.g. injected fields)", () => {
    const r = parseModelOutput(findingsJson({ systemPrompt: "leak", __proto__: { admin: true } }));
    expect(r.ok && "systemPrompt" in r.data).toBe(false);
  });
});

describe("helpers", () => {
  it("extractJsonObject returns null without braces", () => expect(extractJsonObject("nothing")).toBeNull());
  it("repair prompt labels previous output as untrusted and truncates it", () => {
    const p = buildRepairPrompt("x".repeat(10_000), "bad");
    expect(p).toContain("untrusted");
    expect(p.length).toBeLessThan(4000);
  });
});
