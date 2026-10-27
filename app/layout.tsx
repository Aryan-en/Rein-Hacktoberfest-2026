import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import { AuthProvider } from "@/context/auth-context";
import { InvestigationProvider } from "@/context/investigation-context";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const deva = Noto_Sans_Devanagari({ variable: "--font-deva", subsets: ["devanagari"], display: "swap" });

export const metadata: Metadata = {
  title: "TrustLens AI: Understand the Threat. Verify the Evidence.",
  description: "Open-source, evidence-based scam and phishing investigation with explainable English and Hindi reports.",
};

export const viewport: Viewport = { themeColor: "#080F1D", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${deva.variable} dark h-full`}>
      <body className="min-h-full">
        <InvestigationProvider>
          <AuthProvider>{children}</AuthProvider>
        </InvestigationProvider>
      </body>
    </html>
  );
}
