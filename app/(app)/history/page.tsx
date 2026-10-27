import type { Metadata } from "next";
import { HistoryList } from "@/components/investigate/HistoryList";

export const metadata: Metadata = { title: "History · TrustLens AI" };

export default function HistoryPage() {
  return <HistoryList />;
}
