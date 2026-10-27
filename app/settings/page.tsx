import type { Metadata } from "next";
import { SettingsPanel } from "@/components/investigate/SettingsPanel";

export const metadata: Metadata = { title: "Settings · TrustLens AI" };

export default function SettingsPage() {
  return <SettingsPanel />;
}
