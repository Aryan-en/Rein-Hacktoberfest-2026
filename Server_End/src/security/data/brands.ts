// Small curated brand table (India-focused + global majors). Disclosed as limited coverage.
// `tokens`: strings that, appearing in a hostname outside an official domain, suggest impersonation.
// `domains`: official registrable domains.
export interface Brand {
  name: string;
  tokens: string[];
  domains: string[];
}

export const BRANDS: Brand[] = [
  { name: "State Bank of India", tokens: ["sbi", "onlinesbi", "statebankofindia"], domains: ["sbi.co.in", "onlinesbi.sbi", "onlinesbi.com", "sbicard.com", "sbi.bank.in", "sbilife.co.in"] },
  { name: "HDFC Bank", tokens: ["hdfc", "hdfcbank"], domains: ["hdfcbank.com", "hdfc.com", "hdfcbank.net", "hdfclife.com", "hdfcsec.com"] },
  { name: "ICICI Bank", tokens: ["icici", "icicibank"], domains: ["icicibank.com", "icici.com", "icicidirect.com", "iciciprulife.com", "icicilombard.com"] },
  { name: "Axis Bank", tokens: ["axisbank", "axis-bank"], domains: ["axisbank.com", "axis.bank.in"] },
  { name: "Kotak Mahindra Bank", tokens: ["kotak", "kotakbank"], domains: ["kotak.com", "kotakbank.com"] },
  { name: "Punjab National Bank", tokens: ["pnbindia", "punjabnationalbank"], domains: ["pnbindia.in", "netpnb.com", "pnb.bank.in"] },
  { name: "Paytm", tokens: ["paytm"], domains: ["paytm.com", "paytmbank.com", "paytm.in"] },
  { name: "PhonePe", tokens: ["phonepe"], domains: ["phonepe.com"] },
  { name: "Google Pay", tokens: ["googlepay", "gpay"], domains: ["pay.google.com", "google.com"] },
  { name: "BHIM / NPCI", tokens: ["bhim", "npci"], domains: ["npci.org.in", "bhimupi.org.in"] },
  { name: "Income Tax Department (India)", tokens: ["incometax", "incometaxindia"], domains: ["incometax.gov.in", "incometaxindia.gov.in"] },
  { name: "India Post", tokens: ["indiapost"], domains: ["indiapost.gov.in"] },
  { name: "Aadhaar / UIDAI", tokens: ["uidai", "aadhaar", "aadhar"], domains: ["uidai.gov.in"] },
  { name: "Google", tokens: ["google", "gmail"], domains: ["google.com", "gmail.com", "google.co.in", "googleapis.com", "goo.gl", "youtube.com"] },
  { name: "Microsoft", tokens: ["microsoft", "office365", "outlook", "onedrive"], domains: ["microsoft.com", "office.com", "live.com", "outlook.com", "microsoftonline.com", "office365.com", "sharepoint.com"] },
  { name: "Apple", tokens: ["appleid", "icloud"], domains: ["apple.com", "icloud.com"] },
  { name: "Amazon", tokens: ["amazon"], domains: ["amazon.com", "amazon.in", "amazon.co.uk", "amazonaws.com", "amzn.to", "a.co"] },
  { name: "Flipkart", tokens: ["flipkart"], domains: ["flipkart.com", "fkrt.it"] },
  { name: "PayPal", tokens: ["paypal"], domains: ["paypal.com", "paypal.me"] },
  { name: "Netflix", tokens: ["netflix"], domains: ["netflix.com"] },
  { name: "Facebook / Meta", tokens: ["facebook", "instagram"], domains: ["facebook.com", "instagram.com", "meta.com", "fb.com"] },
  { name: "WhatsApp", tokens: ["whatsapp"], domains: ["whatsapp.com", "wa.me", "whatsapp.net"] },
  { name: "Telegram", tokens: ["telegram"], domains: ["telegram.org", "t.me", "telegram.me"] },
  { name: "DHL", tokens: ["dhl"], domains: ["dhl.com", "dhl.de"] },
  { name: "FedEx", tokens: ["fedex"], domains: ["fedex.com"] },
  { name: "LinkedIn", tokens: ["linkedin"], domains: ["linkedin.com", "lnkd.in"] },
  { name: "Naukri", tokens: ["naukri"], domains: ["naukri.com"] },
  { name: "Airtel", tokens: ["airtel"], domains: ["airtel.in", "airtel.com"] },
  { name: "Jio", tokens: ["jio", "reliancejio"], domains: ["jio.com", "ril.com"] },
];

export const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "rebrand.ly",
  "cutt.ly", "shorturl.at", "tiny.cc", "rb.gy", "bl.ink", "s.id", "v.gd", "t.ly",
  "lnkd.in", "shorte.st", "adf.ly", "bit.do", "mcaf.ee", "qr.ae", "x.co", "urlzs.com",
]);

// TLDs with disproportionate abuse in public reporting. Low weight: never sufficient alone.
export const SUSPICIOUS_TLDS = new Set([
  "top", "xyz", "click", "icu", "cfd", "sbs", "rest", "zip", "mov", "gq", "tk", "ml",
  "ga", "cf", "buzz", "monster", "cyou", "quest", "bond", "work", "support", "country",
]);
