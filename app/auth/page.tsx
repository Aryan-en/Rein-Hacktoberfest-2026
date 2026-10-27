import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = { title: "Sign in · TrustLens AI", description: "Sign in or create an optional TrustLens account." };

export default function AuthPage() {
  return <AuthForm />;
}
