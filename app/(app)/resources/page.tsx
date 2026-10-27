import type { Metadata } from "next";
import { ResourcesList } from "@/components/investigate/ResourcesList";

export const metadata: Metadata = { title: "Resources · TrustLens AI" };

export default function ResourcesPage() {
  return <ResourcesList />;
}
