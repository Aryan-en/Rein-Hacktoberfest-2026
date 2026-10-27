import type { LocalizedText } from "./types";

export interface Example {
  id: string;
  label: LocalizedText;
  mode: "text" | "url";
  value: string;
}

// SYNTHETIC samples for demonstration. They only fill the form; analysis still runs the real pipeline.
// Links are never opened by TrustLens.
export const EXAMPLES: Example[] = [
  { id: "bank-kyc", label: { en: "Bank KYC Scam", hi: "बैंक KYC ठगी" }, mode: "text", value: "SBI KYC expired! Update within 24 hrs: http://sbi-kyc-verify.top/login or your account will be blocked. Share OTP to verify." },
  { id: "job-offer", label: { en: "Job Offer Fraud", hi: "नौकरी ऑफ़र ठगी" }, mode: "text", value: "Congratulations! You are selected for Work From Home data entry at Amazon (Rs 45,000/month). Pay a refundable registration fee of Rs 1,499 today to confirm your joining. Contact HR on Telegram." },
  { id: "delivery", label: { en: "Delivery Scam", hi: "डिलीवरी ठगी" }, mode: "text", value: "Your parcel is held at customs. Pay the customs fee here: https://post-india-track.xyz/pay within 24 hours or it will be returned." },
  { id: "link", label: { en: "Suspicious Link", hi: "संदिग्ध लिंक" }, mode: "url", value: "https://paypal.com.secure-login.top/verify" },
];
