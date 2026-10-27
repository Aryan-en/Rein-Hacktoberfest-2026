"use client";

import { ExternalLink } from "lucide-react";
import { useInvestigation } from "@/context/investigation-context";
import { ui } from "@/lib/i18n";

// Fixed official reporting channels (India). These are static links to government/regulator sites, not analysed URLs.
// Not re-verified in this build: confirm before public launch.
const ITEMS = [
  { href: "https://cybercrime.gov.in", name: { en: "National Cyber Crime Reporting Portal", hi: "राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल" }, d: { en: "Report online financial fraud and other cyber crimes. For urgent financial fraud, call the 1930 helpline.", hi: "ऑनलाइन वित्तीय धोखाधड़ी और अन्य साइबर अपराध की रिपोर्ट करें। तुरंत वित्तीय धोखाधड़ी के लिए 1930 हेल्पलाइन पर कॉल करें।" } },
  { href: "https://sancharsaathi.gov.in", name: { en: "Sanchar Saathi (Department of Telecommunications)", hi: "संचार साथी (दूरसंचार विभाग)" }, d: { en: "Report suspected fraudulent calls and messages and check mobile connections in your name.", hi: "संदिग्ध धोखाधड़ी वाले कॉल और संदेश रिपोर्ट करें और अपने नाम के मोबाइल कनेक्शन जाँचें।" } },
  { href: "https://www.rbi.org.in", name: { en: "Reserve Bank of India", hi: "भारतीय रिज़र्व बैंक" }, d: { en: "Official guidance on banking safety and how to complain about a bank.", hi: "बैंकिंग सुरक्षा पर आधिकारिक मार्गदर्शन और बैंक की शिकायत कैसे करें।" } },
];

export function ResourcesList() {
  const { lang } = useInvestigation();
  return (
    <div>
      <h1 className="text-3xl font-bold">{ui("navResources", lang)}</h1>
      <p className="mt-2 max-w-2xl text-muted">{lang === "hi" ? "धोखाधड़ी की रिपोर्ट करने के आधिकारिक चैनल। यदि आपने पैसे खो दिए हैं तो पहले अपने बैंक को कॉल करें।" : "Official channels for reporting fraud. If you have lost money, call your bank first."}</p>
      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {ITEMS.map((r) => (
          <li key={r.href} className="card p-5">
            <h2 className="font-semibold">{r.name[lang]}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">{r.d[lang]}</p>
            <a href={r.href} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-9 items-center gap-1.5 text-sm text-accent hover:underline">
              {r.href.replace("https://", "")} <ExternalLink aria-hidden className="h-3.5 w-3.5" />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-xs text-muted">{lang === "hi" ? "ये स्थिर आधिकारिक लिंक हैं। उपयोग से पहले आधिकारिक स्रोत से दोबारा जाँच लें।" : "These are fixed official links. Double-check them against an official source before relying on them."}</p>
    </div>
  );
}
