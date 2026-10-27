import type { Lang, LocalizedText } from "./types";

/** Picks the requested language, falling back to English when Hindi is missing (never machine-translates). */
export function pick(t: LocalizedText | undefined | null, lang: Lang): string {
  if (!t) return "";
  return lang === "hi" && t.hi.trim() ? t.hi : t.en;
}
export const hindiMissing = (t: LocalizedText | undefined | null, lang: Lang): boolean => lang === "hi" && !!t && !t.hi.trim();

const UI = {
  tagline: { en: "Understand the Threat. Verify the Evidence.", hi: "खतरे को समझें। सबूत जाँचें।" },
  navInvestigate: { en: "Investigate", hi: "जाँच करें" },
  navDashboard: { en: "Dashboard", hi: "डैशबोर्ड" },
  navResources: { en: "Resources", hi: "संसाधन" },
  navSettings: { en: "Settings", hi: "सेटिंग्स" },
  navHistory: { en: "History", hi: "इतिहास" },
  navLearn: { en: "Learn & Protect", hi: "सीखें और बचें" },
  heroA: { en: "Detect", hi: "ठगी" },
  heroScams: { en: "Scams.", hi: "पकड़ें।" },
  heroB: { en: "Expose", hi: "फ़िशिंग" },
  heroPhishing: { en: "Phishing.", hi: "बेनकाब करें।" },
  heroC: { en: "Stay One Step Ahead.", hi: "एक कदम आगे रहें।" },
  heroSub: { en: "Evidence-based investigation of suspicious messages, links and screenshots.", hi: "संदिग्ध संदेशों, लिंक और स्क्रीनशॉट की सबूत-आधारित जाँच।" },
  tabText: { en: "Text / Message", hi: "संदेश" },
  tabUrl: { en: "URL Analysis", hi: "लिंक जाँच" },
  tabImage: { en: "Screenshot", hi: "स्क्रीनशॉट" },
  placeholderText: { en: "Paste suspicious message, email, or text here…", hi: "संदिग्ध संदेश, ईमेल या टेक्स्ट यहाँ चिपकाएँ…" },
  placeholderUrl: { en: "Paste a suspicious link (we never open it)", hi: "संदिग्ध लिंक चिपकाएँ (हम इसे कभी नहीं खोलते)" },
  tryExample: { en: "Try an example:", hi: "उदाहरण आज़माएँ:" },
  analyze: { en: "Analyze with TrustLens AI", hi: "TrustLens AI से जाँचें" },
  analyzing: { en: "Analyzing…", hi: "जाँच हो रही है…" },
  privacy: { en: "Content is analyzed and not stored by TrustLens. Remove OTPs and personal details first.", hi: "सामग्री की जाँच होती है, TrustLens उसे सहेजता नहीं। पहले OTP और निजी जानकारी हटा दें।" },
  howItWorks: { en: "How it works", hi: "यह कैसे काम करता है" },
  recent: { en: "Recent Investigation", hi: "हाल की जाँच" },
  viewAll: { en: "View All", hi: "सब देखें" },
  noneYet: { en: "No investigations yet this session. Run one and it will appear here.", hi: "इस सत्र में अभी कोई जाँच नहीं। एक जाँच करें, वह यहाँ दिखेगी।" },
  evidenceFound: { en: "Evidence", hi: "सबूत" },
  riskFactors: { en: "Indicators", hi: "संकेत" },
  suspiciousUrl: { en: "Links", hi: "लिंक" },
  whyRating: { en: "Why this rating", hi: "यह रेटिंग क्यों" },
  whatWeCheck: { en: "What TrustLens checks", hi: "TrustLens क्या जाँचता है" },
  protect: { en: "Protect Yourself", hi: "खुद को बचाएँ" },
  protectBody: { en: "Learn how to spot scams, verify messages, and stay safe online.", hi: "ठगी पहचानना, संदेश जाँचना और ऑनलाइन सुरक्षित रहना सीखें।" },
  viewGuide: { en: "View Guide", hi: "गाइड देखें" },
  systemStatus: { en: "System Status", hi: "सिस्टम स्थिति" },
  online: { en: "Online", hi: "चालू" },
  offline: { en: "Backend unreachable", hi: "बैकएंड उपलब्ध नहीं" },
  aiOff: { en: "AI off (rules only)", hi: "AI बंद (केवल नियम)" },
} satisfies Record<string, LocalizedText>;

export type UiKey = keyof typeof UI;
export const ui = (k: UiKey, lang: Lang): string => UI[k][lang];
