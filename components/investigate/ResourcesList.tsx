"use client";

import { useMemo, useState } from "react";
import {
  ExternalLink,
  PhoneCall,
  ShieldAlert,
  Building2,
  Smartphone,
  Search,
  Globe,
  Radio,
  FileCheck2,
} from "lucide-react";
import { useInvestigation } from "@/context/investigation-context";
import { ui } from "@/lib/i18n";

type CategoryId = "all" | "emergency" | "banking" | "telecom" | "intelligence" | "global";

interface ResourceItem {
  id: string;
  category: "emergency" | "banking" | "telecom" | "intelligence" | "global";
  href: string;
  name: { en: string; hi: string };
  d: { en: string; hi: string };
  helpline?: string;
  tag: { en: string; hi: string };
  authority: { en: string; hi: string };
}

const RESOURCES: ResourceItem[] = [
  // 1. Emergency & Incident Helplines
  {
    id: "cybercrime-1930",
    category: "emergency",
    href: "https://cybercrime.gov.in",
    helpline: "1930",
    name: {
      en: "National Cyber Financial Fraud Helpline (1930)",
      hi: "राष्ट्रीय साइबर वित्तीय धोखाधड़ी हेल्पलाइन (1930)",
    },
    authority: { en: "Ministry of Home Affairs / I4C", hi: "गृह मंत्रालय / I4C" },
    tag: { en: "Immediate Action", hi: "तत्काल कार्रवाई" },
    d: {
      en: "Citizen Financial Cyber Fraud Reporting System (CFCFRMS). Dial 1930 within the 'Golden Hour' of an unauthorized transaction to freeze funds across participating banks.",
      hi: "नागरिक वित्तीय साइबर अपराध रिपोर्टिंग प्रणाली। अनधिकृत लेन-देन के 'गोल्डन ऑवर' के भीतर 1930 डायल करें ताकि बैंकों के बीच फंड को तुरंत फ्रीज कराया जा सके।",
    },
  },
  {
    id: "cybercrime-portal",
    category: "emergency",
    href: "https://cybercrime.gov.in",
    name: {
      en: "National Cyber Crime Reporting Portal",
      hi: "राष्ट्रीय साइबर अपराध रिपोर्टिंग पोर्टल",
    },
    authority: { en: "Government of India", hi: "भारत सरकार" },
    tag: { en: "Official FIR / Complaint", hi: "आधिकारिक शिकायत" },
    d: {
      en: "Centralized government portal for lodging formal complaints against financial fraud, online identity theft, cyberstalking, and digital extortion.",
      hi: "वित्तीय धोखाधड़ी, पहचान चोरी, साइबर उत्पीड़न और डिजिटल ब्लैकमेल के खिलाफ औपचारिक शिकायत दर्ज कराने का केंद्रीय सरकारी पोर्टल।",
    },
  },
  {
    id: "chakshu-dot",
    category: "emergency",
    href: "https://sancharsaathi.gov.in/sfc/",
    name: {
      en: "Chakshu (Sanchar Saathi)",
      hi: "चक्षु (संचार साथी)",
    },
    authority: { en: "Department of Telecommunications", hi: "दूरसंचार विभाग" },
    tag: { en: "Fraud Calls & SMS", hi: "फर्जी कॉल व संदेश" },
    d: {
      en: "Facility to report suspected fraudulent SMS, WhatsApp messages, and calls (e.g. fake electricity disconnection notices, impersonation of officials, lottery scams).",
      hi: "संदिग्ध धोखाधड़ी वाले SMS, WhatsApp संदेशों और फर्जी कॉल (जैसे बिजली बिल काटना, अधिकारी बनकर धमकाना, लॉटरी आदि) की शिकायत करने की आधिकारिक DoT सुविधा।",
    },
  },
  {
    id: "consumer-helpline",
    category: "emergency",
    href: "https://consumerhelpline.gov.in",
    helpline: "1915",
    name: {
      en: "National Consumer Helpline (1915)",
      hi: "राष्ट्रीय उपभोक्ता हेल्पलाइन (1915)",
    },
    authority: { en: "Ministry of Consumer Affairs", hi: "उपभोक्ता मामले मंत्रालय" },
    tag: { en: "E-Commerce Scams", hi: "ई-कॉमर्स ठगी" },
    d: {
      en: "Report fraudulent e-commerce stores, fake online shopping websites, deceptive refund promises, and non-delivery of prepaid merchant orders.",
      hi: "नकली ई-कॉमर्स साइटों, फर्जी शॉपिंग वेबसाइटों, झूठे रिफंड वादों और प्रीपेड ऑर्डर की डिलीवरी न मिलने की रिपोर्ट करें।",
    },
  },

  // 2. Banking, UPI & Payment Regulators
  {
    id: "rbi-sachet",
    category: "banking",
    href: "https://sachet.rbi.org.in",
    name: {
      en: "Reserve Bank of India — Sachet Portal",
      hi: "भारतीय रिज़र्व बैंक — सचेत पोर्टल",
    },
    authority: { en: "Reserve Bank of India", hi: "भारतीय रिज़र्व बैंक" },
    tag: { en: "Unregistered Entities", hi: "अवैध वित्तीय कंपनियाँ" },
    d: {
      en: "RBI's public watchdog portal to verify registered NBFCs and financial entities. File complaints against unauthorized loan apps and illegal deposit schemes.",
      hi: "RBI का पब्लिक पोर्टल जहाँ पंजीकृत संस्थाओं की जाँच की जा सकती है। अनधिकृत लोन ऐप्स और अवैध जमा योजनाओं की शिकायत दर्ज करें।",
    },
  },
  {
    id: "rbi-cms",
    category: "banking",
    href: "https://cms.rbi.org.in",
    helpline: "14440",
    name: {
      en: "RBI Banking Ombudsman (CMS Portal)",
      hi: "RBI बैंकिंग लोकपाल (CMS पोर्टल)",
    },
    authority: { en: "RBI Ombudsman", hi: "RBI लोकपाल" },
    tag: { en: "Bank Dispute Escalation", hi: "बैंक विवाद समाधान" },
    d: {
      en: "Escalate unresolved banking disputes if your bank fails to redress claims regarding unauthorized debits or ATM/net-banking fraud within 30 days.",
      hi: "यदि आपका बैंक 30 दिनों के भीतर अनधिकृत निकासी या नेट-बैंकिंग धोखाधड़ी की शिकायत का समाधान नहीं करता, तो सीधे लोकपाल में अपील करें।",
    },
  },
  {
    id: "npci-upi-safety",
    category: "banking",
    href: "https://www.npci.org.in",
    name: {
      en: "NPCI UPI Safety & Dispute Shield",
      hi: "NPCI UPI सुरक्षा और विवाद निवारण",
    },
    authority: { en: "NPCI", hi: "भारतीय राष्ट्रीय भुगतान निगम" },
    tag: { en: "UPI & QR Security", hi: "UPI और QR सुरक्षा" },
    d: {
      en: "National Payments Corporation of India guidelines on UPI security. Critical rule: You NEVER need to enter your UPI PIN to receive money.",
      hi: "NPCI की UPI सुरक्षा गाइडलाइन। आवश्यक नियम: पैसे प्राप्त करने के लिए आपको कभी भी अपना UPI PIN दर्ज करने की आवश्यकता नहीं होती।",
    },
  },
  {
    id: "sebi-scores",
    category: "banking",
    href: "https://scores.sebi.gov.in",
    name: {
      en: "SEBI SCORES (Securities Scams)",
      hi: "SEBI स्कोर्स (शेयर व निवेश धोखाधड़ी)",
    },
    authority: { en: "Securities & Exchange Board of India", hi: "SEBI" },
    tag: { en: "Stock & Crypto Scams", hi: "शेयर बाजार ठगी" },
    d: {
      en: "Lodge complaints against fake stock market advisors, fraudulent WhatsApp/Telegram trading groups, unauthorized portfolio schemes, and bogus IPO allotments.",
      hi: "फर्जी शेयर बाजार सलाहकारों, भ्रामक WhatsApp/Telegram ट्रेडिंग ग्रुप्स, अनधिकृत निवेश योजनाओं और नकली IPO आवंटन के खिलाफ शिकायत करें।",
    },
  },

  // 3. Telecom & SIM Security
  {
    id: "tafcop-sim",
    category: "telecom",
    href: "https://tafcop.sancharsaathi.gov.in",
    name: {
      en: "TAFCOP (Check SIM Cards in Your Name)",
      hi: "TAFCOP (अपने नाम के सभी सिम कार्ड जाँचें)",
    },
    authority: { en: "DoT / Sanchar Saathi", hi: "दूरसंचार विभाग" },
    tag: { en: "SIM Identity Theft", hi: "सिम पहचान सुरक्षा" },
    d: {
      en: "Telecom Analytics for Fraud Management. Check all active mobile numbers registered against your Aadhaar/identity document and report unauthorized SIMs for deactivation.",
      hi: "अपने आधार/पहचान पत्र पर चालू सभी मोबाइल नंबरों की सूची देखें और किसी भी अनधिकृत सिम कार्ड को तुरंत बंद करने की रिपोर्ट दर्ज करें।",
    },
  },
  {
    id: "ceir-lost-mobile",
    category: "telecom",
    href: "https://www.ceir.gov.in",
    name: {
      en: "CEIR (Block Lost or Stolen Mobile Phones)",
      hi: "CEIR (खोए या चोरी हुए मोबाइल को ब्लॉक करें)",
    },
    authority: { en: "Central Equipment Identity Register", hi: "केंद्रीय उपकरण पहचान रजिस्टर" },
    tag: { en: "IMEI Blacklisting", hi: "IMEI ब्लॉकिंग" },
    d: {
      en: "Block the IMEI number of lost or stolen mobile handsets across all Indian telecom operators to prevent unauthorized use, cloning, and identity abuse.",
      hi: "खोए या चोरी हुए मोबाइल फोन के IMEI को भारत के सभी नेटवर्क पर ब्लॉक करें ताकि उसका कोई दुरुपयोग या डेटा चोरी न कर सके।",
    },
  },
  {
    id: "uidai-biometric-lock",
    category: "telecom",
    href: "https://myaadhaar.uidai.gov.in",
    helpline: "1947",
    name: {
      en: "UIDAI Aadhaar Biometric Lock / Unlock",
      hi: "UIDAI आधार बायोमेट्रिक लॉक / अनलॉक",
    },
    authority: { en: "UIDAI", hi: "भारतीय विशिष्ट पहचान प्राधिकरण" },
    tag: { en: "AePS Fraud Prevention", hi: "AePS ठगी से बचाव" },
    d: {
      en: "Lock your Aadhaar biometric data to prevent unauthorized fingerprint-based cash withdrawals through the Aadhaar Enabled Payment System (AePS).",
      hi: "AePS के जरिए बायोमेट्रिक क्लोनिंग और अनधिकृत बैंक निकासी से बचने के लिए अपने आधार बायोमेट्रिक्स (फिंगरप्रिंट) को लॉक करें।",
    },
  },

  // 4. Threat Intelligence & Forensic Tools
  {
    id: "cert-in",
    category: "intelligence",
    href: "https://www.cert-in.org.in",
    name: {
      en: "CERT-In (Indian Computer Emergency Response Team)",
      hi: "CERT-In (भारतीय कंप्यूटर आपातकालीन प्रतिक्रिया दल)",
    },
    authority: { en: "Ministry of Electronics & IT", hi: "इलेक्ट्रॉनिक्स और IT मंत्रालय" },
    tag: { en: "Cyber Advisories", hi: "सुरक्षा सलाह" },
    d: {
      en: "National nodal agency for incident response. Provides security bulletins, ransomware alerts, vulnerability tracking, and guidelines for protecting digital infrastructure.",
      hi: "साइबर सुरक्षा घटनाओं से निपटने वाली राष्ट्रीय नोडल एजेंसी। सुरक्षा बुलेटिन, मैलवेयर अलर्ट, कमियों की जानकारी और दिशा-निर्देश प्रदान करती है।",
    },
  },
  {
    id: "google-safebrowsing",
    category: "intelligence",
    href: "https://transparencyreport.google.com/safe-browsing/search",
    name: {
      en: "Google Safe Browsing Transparency Lookup",
      hi: "Google सेफ ब्राउज़िंग ट्रांसपेरेंसी रिपोर्ट",
    },
    authority: { en: "Google Security", hi: "Google सिक्योरिटी" },
    tag: { en: "URL Reputation", hi: "URL प्रतिष्ठा जाँच" },
    d: {
      en: "Check whether a specific web address is currently classified by global automated security scanners as hosting phishing kits, malware, or deceptive software.",
      hi: "जाँचें कि क्या कोई विशेष वेब लिंक या डोमेन फ़िशिंग, मैलवेयर या संदिग्ध सॉफ़्टवेयर के लिए वैश्विक सुरक्षा स्कैनर द्वारा चिह्नित है।",
    },
  },
  {
    id: "phishtank",
    category: "intelligence",
    href: "https://phishtank.org",
    name: {
      en: "PhishTank Global Phishing Database",
      hi: "PhishTank वैश्विक फ़िशिंग डेटाबेस",
    },
    authority: { en: "OpenDNS / Cisco", hi: "OpenDNS / सिस्को" },
    tag: { en: "Phishing Intelligence", hi: "फ़िशिंग डेटाबेस" },
    d: {
      en: "Collaborative clearinghouse data feed where verified phishing sites and credential-harvesting web pages are catalogued and verified by security researchers.",
      hi: "वैश्विक डेटाबेस जहाँ सुरक्षा विश्लेषकों द्वारा सत्यापित फ़िशिंग और लॉगिन चोरी करने वाली वेबसाइटों की सूची बनाई जाती है।",
    },
  },

  // 5. Global & Cross-Border Reporting
  {
    id: "fbi-ic3",
    category: "global",
    href: "https://www.ic3.gov",
    name: {
      en: "FBI Internet Crime Complaint Center (IC3)",
      hi: "FBI इंटरनेट अपराध शिकायत केंद्र (IC3)",
    },
    authority: { en: "Federal Bureau of Investigation", hi: "FBI" },
    tag: { en: "Cross-Border Fraud", hi: "अंतर्राष्ट्रीय अपराध" },
    d: {
      en: "Report international cyber fraud, Business Email Compromise (BEC), overseas investment scams, and organized ransomware operations involving foreign entities.",
      hi: "अंतर्राष्ट्रीय साइबर अपराध, बिजनेस ईमेल धोखाधड़ी, विदेशी फर्जी निवेश कंपनियों और संगठित साइबर गिरोहों की रिपोर्ट करें।",
    },
  },
  {
    id: "scamwatch-au",
    category: "global",
    href: "https://www.scamwatch.gov.au",
    name: {
      en: "Scamwatch (Australia ACCC)",
      hi: "स्कैमवॉच (ऑस्ट्रेलिया ACCC)",
    },
    authority: { en: "Australian Competition & Consumer Commission", hi: "ACCC" },
    tag: { en: "Scam Trends & Warning Signs", hi: "वैश्विक धोखाधड़ी के संकेत" },
    d: {
      en: "International resource documenting evolving scam formats, deepfake impersonation methods, overseas job scams, and practical prevention advice.",
      hi: "उभरते घोटालों, डीपफेक धोखाधड़ी, विदेशी नौकरी के झांसे और व्यावहारिक बचाव की रणनीतियों को संकलित करने वाला अंतर्राष्ट्रीय स्रोत।",
    },
  },
];

const CATEGORIES: Array<{ id: CategoryId; label: { en: string; hi: string }; icon: typeof ShieldAlert }> = [
  { id: "all", label: { en: "All Resources", hi: "सभी संसाधन" }, icon: FileCheck2 },
  { id: "emergency", label: { en: "Emergency & Helplines", hi: "आपातकालीन व हेल्पलाइन" }, icon: ShieldAlert },
  { id: "banking", label: { en: "Banking & UPI", hi: "बैंकिंग और UPI" }, icon: Building2 },
  { id: "telecom", label: { en: "Telecom & Identity", hi: "दूरसंचार और पहचान" }, icon: Smartphone },
  { id: "intelligence", label: { en: "Threat Intel & Tools", hi: "थ्रेट इंटेल और टूल्स" }, icon: Radio },
  { id: "global", label: { en: "Global Channels", hi: "अंतर्राष्ट्रीय चैनल" }, icon: Globe },
];

export function ResourcesList() {
  const { lang } = useInvestigation();
  const [activeCategory, setActiveCategory] = useState<CategoryId>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESOURCES.filter((item) => {
      const matchCategory = activeCategory === "all" || item.category === activeCategory;
      if (!matchCategory) return false;
      if (!q) return true;
      const haystack = [
        item.name.en,
        item.name.hi,
        item.d.en,
        item.d.hi,
        item.authority.en,
        item.authority.hi,
        item.tag.en,
        item.tag.hi,
        item.helpline ?? "",
        item.href,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [activeCategory, query]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{ui("navResources", lang)}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
          {lang === "hi"
            ? "वित्तीय धोखाधड़ी, फ़िशिंग, फर्जी कॉल और अनधिकृत सिम कनेक्शन की रिपोर्ट करने के लिए सत्यापित सरकारी एवं विनियामक चैनल।"
            : "Verified official government portals, national cyber helplines, and regulatory channels for reporting fraud, identity theft, and suspicious activity."}
        </p>
      </div>

      {/* Emergency Callout Banner */}
      <div className="rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-red-900/20 to-neutral-900/80 p-5 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-600/20 text-red-400 ring-1 ring-red-500/40">
              <PhoneCall className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-300 ring-1 ring-red-500/30">
                  {lang === "hi" ? "आपातकालीन वित्तीय हेल्पलाइन" : "Immediate Financial Emergency"}
                </span>
                <span className="text-xs text-muted">
                  {lang === "hi" ? "गोल्डन ऑवर में कॉल करें" : "Act within the Golden Hour"}
                </span>
              </div>
              <h2 className="mt-1 text-base font-bold text-red-200">
                {lang === "hi"
                  ? "पैसे कटने पर तुरंत 1930 पर कॉल करें और अपने बैंक से संपर्क करें"
                  : "If you have lost money to fraud, call 1930 immediately & alert your bank"}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {lang === "hi"
                  ? "अनधिकृत लेन-देन के 2-3 घंटे के भीतर 1930 पर रिपोर्ट करने से अंतर-बैंक CFCFRMS सिस्टम के माध्यम से ठग के खाते में पैसे फ्रीज कराए जा सकते हैं।"
                  : "Reporting to 1930 within 2-3 hours of an unauthorized debit enables the CFCFRMS network to hold fraudulent fund movements across participating financial institutions."}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <a
              href="tel:1930"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-500"
            >
              <PhoneCall className="h-4 w-4" />
              <span>{lang === "hi" ? "कॉल करें: 1930" : "Dial 1930"}</span>
            </a>
            <a
              href="https://cybercrime.gov.in"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/30 px-3.5 py-2 text-sm font-medium text-red-200 hover:bg-red-900/40"
            >
              <span>cybercrime.gov.in</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              lang === "hi"
                ? "संसाधन, हेल्पलाइन या कीवर्ड खोजें…"
                : "Search portals, helplines, or keywords…"
            }
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900/90 py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "bg-accent/20 text-accent ring-1 ring-accent/40"
                    : "border border-neutral-800/80 bg-neutral-900/60 text-muted hover:border-neutral-700 hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label[lang]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resource Cards Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-12 text-center">
          <Search className="mx-auto h-8 w-8 text-muted" />
          <p className="mt-3 text-sm font-medium text-foreground">
            {lang === "hi" ? "कोई संसाधन नहीं मिला" : "No matching resources found"}
          </p>
          <p className="mt-1 text-xs text-muted">
            {lang === "hi"
              ? "दूसरा खोज शब्द आज़माएँ या श्रेणी फ़िल्टर रीसेट करें।"
              : "Try different keywords or reset your category filter."}
          </p>
          <button
            onClick={() => {
              setActiveCategory("all");
              setQuery("");
            }}
            className="mt-4 inline-flex items-center rounded-lg border border-neutral-700 bg-neutral-800 px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-neutral-700"
          >
            {lang === "hi" ? "फ़िल्टर रीसेट करें" : "Reset filters"}
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map((r) => {
            const isEmergency = r.category === "emergency";
            const isBanking = r.category === "banking";
            const isTelecom = r.category === "telecom";
            const isIntel = r.category === "intelligence";

            const badgeColor = isEmergency
              ? "bg-red-500/15 text-red-300 border-red-500/30"
              : isBanking
              ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
              : isTelecom
              ? "bg-cyan-500/15 text-cyan-300 border-cyan-500/30"
              : isIntel
              ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
              : "bg-purple-500/15 text-purple-300 border-purple-500/30";

            return (
              <div
                key={r.id}
                className="group relative flex flex-col justify-between rounded-xl border border-neutral-800/80 bg-neutral-900/70 p-5 shadow-sm transition-all hover:border-neutral-700 hover:bg-neutral-900/90 hover:shadow-md"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-medium tracking-wide uppercase text-muted">
                        {r.authority[lang]}
                      </span>
                      <h3 className="text-base font-semibold text-foreground group-hover:text-accent transition-colors">
                        {r.name[lang]}
                      </h3>
                    </div>
                    <span
                      className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium ${badgeColor}`}
                    >
                      {r.tag[lang]}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="mt-2.5 text-xs leading-relaxed text-muted">{r.d[lang]}</p>
                </div>

                {/* Footer / Action */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800/60 pt-3.5">
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
                  >
                    <span>
                      {r.href
                        .replace("https://", "")
                        .replace("http://", "")
                        .replace(/\/$/, "")}
                    </span>
                    <ExternalLink aria-hidden className="h-3 w-3" />
                  </a>

                  {r.helpline && (
                    <a
                      href={`tel:${r.helpline}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-neutral-700 bg-neutral-800/70 px-2.5 py-1 text-xs font-semibold text-foreground hover:border-accent hover:text-accent transition-colors"
                      title={lang === "hi" ? "कॉल करने के लिए क्लिक करें" : "Click to dial helpline"}
                    >
                      <PhoneCall className="h-3 w-3 text-accent" />
                      <span>{r.helpline}</span>
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Safety Note Disclaimer */}
      <div className="rounded-lg border border-neutral-800/80 bg-neutral-900/40 p-4 text-xs text-muted">
        <p>
          {lang === "hi"
            ? "सूचना: ये सभी लिंक भारत सरकार, भारतीय रिज़र्व बैंक (RBI), दूरसंचार विभाग (DoT) तथा अधिकृत वैश्विक विनियामकों के आधिकारिक सार्वजनिक पोर्टल हैं। किसी भी अज्ञात संदेश या ईमेल में आए लिंक पर भरोसा करने के बजाय हमेशा इन आधिकारिक पतों पर सीधे जाएँ।"
            : "Verification Note: These links lead directly to official portals maintained by Government of India ministries, the Reserve Bank of India, DoT, and accredited international cyber authorities. Never use phone numbers or web addresses provided inside suspicious messages."}
        </p>
      </div>
    </div>
  );
}
