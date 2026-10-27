import { describe, expect, it, vi } from "vitest";
import { extractUrls } from "../../../src/security/url/extract";
import { analyzeUrl, editDistance, foldConfusables } from "../../../src/security/url/heuristics";
import { parseUrl } from "../../../src/security/url/parse";

const ids = (raw: string) => analyzeUrl(raw, null).signals.map((s) => s.id);

describe("extractUrls", () => {
  it("finds schemed, www and bare-domain URLs and trims punctuation", () => {
    const t = "Visit https://a.example.com/x?y=1, or www.test.org. Also bit.ly/abc!";
    const raw = extractUrls(t).urls.map((u) => u.raw);
    expect(raw).toContain("https://a.example.com/x?y=1");
    expect(raw).toContain("www.test.org");
    expect(raw).toContain("bit.ly/abc");
  });
  it("ignores emails, filenames and numbers", () => {
    expect(extractUrls("mail me at john@gmail.com, see report.txt and v3.5").urls).toHaveLength(0);
  });
  it("handles defanged hxxp and [.]", () => {
    const u = extractUrls("hxxps://evil[.]example/login").urls;
    expect(u).toHaveLength(1);
    expect(parseUrl(u[0]!.raw).parsed?.hostname).toBe("evil.example");
  });
  it("caps at 5 and reports omitted", () => {
    const t = Array.from({ length: 8 }, (_, i) => `https://s${i}.example.com`).join(" ");
    const r = extractUrls(t);
    expect(r.urls).toHaveLength(5);
    expect(r.omitted).toBe(3);
  });
  it("returns correct spans", () => {
    const t = "go to https://x.example.com/p now";
    const u = extractUrls(t).urls[0]!;
    expect(t.slice(...u.span)).toBe("https://x.example.com/p");
  });
});

describe("parseUrl", () => {
  it("splits registrable domain, subdomain and suffix", () => {
    const p = parseUrl("https://login.secure.example.co.uk:8443/a?b=1").parsed!;
    expect(p.registrableDomain).toBe("example.co.uk");
    expect(p.subdomain).toBe("login.secure");
    expect(p.publicSuffix).toBe("co.uk");
    expect(p.port).toBe("8443");
  });
  it("normalises decimal and hex IPv4 to dotted form", () => {
    expect(parseUrl("http://3232235777/").parsed?.hostname).toBe("192.168.1.1");
    expect(parseUrl("http://0xC0A80101/").parsed?.isIp).toBe(true);
  });
  it("detects IPv6", () => {
    expect(parseUrl("http://[::1]/").parsed?.isIp).toBe(true);
  });
  it("returns null parsed for garbage and non-web schemes", () => {
    expect(parseUrl("http://").parsed).toBeNull();
    expect(parseUrl("javascript:alert(1)").parsed).toBeNull();
  });
  it("strips trailing dot from host", () => {
    expect(parseUrl("https://example.com./").parsed?.hostname).toBe("example.com");
  });
  it("performs no network access", () => {
    const f = vi.spyOn(globalThis, "fetch");
    parseUrl("https://evil.example/login");
    analyzeUrl("http://192.0.2.1/x", null);
    expect(f).not.toHaveBeenCalled();
    f.mockRestore();
  });
});

describe("URL heuristics: positives", () => {
  it("IP host (strong)", () => expect(ids("http://203.0.113.9/login")).toContain("url_ip_host"));
  it("userinfo trick", () => expect(ids("https://google.com@evil.example/")).toContain("url_userinfo"));
  it("deceptive subdomain", () => expect(ids("https://paypal.com.secure-login.xyz/verify")).toContain("url_deceptive_subdomain"));
  it("brand mismatch with hyphenated host", () => {
    const r = ids("http://sbi-kyc-verify.top/login");
    expect(r).toContain("url_brand_mismatch");
    expect(r).toContain("url_suspicious_tld");
    expect(r).toContain("url_no_tls");
  });
  it("typosquat lookalike (digit swap)", () => expect(ids("https://paypa1.com/")).toContain("url_lookalike_domain"));
  it("typosquat lookalike (missing letter)", () => expect(ids("https://amazom.in/")).toContain("url_lookalike_domain"));
  it("punycode escalates to strong when brand lookalike", () => {
    const a = analyzeUrl("https://xn--pypal-4ve.com/", null);
    expect(a.signals.some((s) => s.id === "url_punycode")).toBe(true);
  });
  it("mixed script", () => expect(ids("https://pаypal.com/")).toContain("url_mixed_script")); // Cyrillic а
  it("shortener", () => expect(ids("https://bit.ly/3abc")).toContain("url_shortener"));
  it("excess subdomains", () => expect(ids("https://a.b.c.d.example.com/")).toContain("url_excess_subdomains"));
  it("encoding abuse (double encoding)", () => expect(ids("https://example.com/%2540admin")).toContain("url_encoding_abuse"));
  it("nonstandard port", () => expect(ids("https://example.com:8081/")).toContain("url_nonstandard_port"));
  it("unparseable", () => expect(ids("http://")).toContain("url_unparseable"));
  it("scheme-less input does not trigger no-tls", () => expect(ids("example.com/x")).not.toContain("url_no_tls"));
});

describe("URL heuristics: benign negatives", () => {
  it.each([
    "https://www.sbi.co.in/",
    "https://onlinesbi.sbi/",
    "https://accounts.google.com/signin",
    "https://www.amazon.in/dp/B000",
    "https://aws.amazon.com/",
    "https://www.paypal.com/signin",
    "https://github.com/user/repo",
    "https://www.hdfcbank.com/personal",
  ])("no brand signals for %s", (u) => {
    const r = ids(u);
    expect(r).not.toContain("url_brand_mismatch");
    expect(r).not.toContain("url_lookalike_domain");
    expect(r).not.toContain("url_deceptive_subdomain");
  });
  it("a clean https URL yields no strong signals", () => {
    const s = analyzeUrl("https://example.com/page", null).signals;
    expect(s.filter((x) => x.severity === "strong")).toHaveLength(0);
  });
});

describe("helpers", () => {
  it("editDistance handles transposition", () => {
    expect(editDistance("paypal", "papyal")).toBe(1);
    expect(editDistance("abc", "abc")).toBe(0);
  });
  it("foldConfusables maps homoglyphs and digits", () => {
    expect(foldConfusables("pаypa1")).toBe("paypal");
    expect(foldConfusables("rnicrosoft")).toBe("microsoft");
  });
});
