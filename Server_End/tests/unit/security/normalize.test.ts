import { describe, expect, it } from "vitest";
import { countMeaningfulChars, foldForMatching, normalizeText } from "../../../src/security/normalize";

describe("normalizeText", () => {
  it("strips zero-width and bidi characters and reports it", () => {
    const r = normalizeText("pay​pal‮.com");
    expect(r.text).toBe("paypal.com");
    expect(r.hiddenCharactersRemoved).toBe(true);
  });
  it("reports false when nothing hidden", () => {
    expect(normalizeText("hello").hiddenCharactersRemoved).toBe(false);
  });
  it("applies NFKC", () => {
    expect(normalizeText("ＳＢＩ").text).toBe("SBI");
  });
  it("replaces control chars but keeps newlines", () => {
    expect(normalizeText("a\u0000b\nc").text).toBe("a b\nc");
  });
  it("truncates to max and flags it", () => {
    const r = normalizeText("x".repeat(50), 10);
    expect(r.text).toHaveLength(10);
    expect(r.truncated).toBe(true);
  });
  it("is idempotent", () => {
    const once = normalizeText(" a​ b \r\n c ").text;
    expect(normalizeText(once).text).toBe(once);
  });
  it("foldForMatching maps back to original offsets", () => {
    const { folded, map } = foldForMatching("Hello   World");
    expect(folded).toBe("hello world");
    expect(map[folded.indexOf("world")]).toBe(8);
  });
  it("counts meaningful chars without whitespace", () => {
    expect(countMeaningfulChars(" a b\n c ")).toBe(3);
  });
});
