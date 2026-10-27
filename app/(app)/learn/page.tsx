import type { Metadata } from "next";
import { LearnGuide } from "@/components/investigate/LearnGuide";

export const metadata: Metadata = { title: "Learn & Protect · TrustLens AI" };

export default function LearnPage() {
  return <LearnGuide />;
}
