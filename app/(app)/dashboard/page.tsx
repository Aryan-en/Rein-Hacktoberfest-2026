import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/Dashboard";

export const metadata: Metadata = { title: "Dashboard · TrustLens AI" };

export default function DashboardPage() {
  return <Dashboard />;
}
