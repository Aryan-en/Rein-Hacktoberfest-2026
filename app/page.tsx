import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "TrustLens AI: Understand the Threat. Verify the Evidence. Stay Protected.",
  description: "Open-source, evidence-based scam and phishing investigation. Explainable English and Hindi reports. No account needed, links never opened, nothing stored.",
  openGraph: { title: "TrustLens AI", description: "Understand the threat. Verify the evidence. Stay protected.", type: "website" },
};

export default function Home() {
  return <LandingPage />;
}
