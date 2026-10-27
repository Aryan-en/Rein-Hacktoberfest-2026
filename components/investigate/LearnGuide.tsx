"use client";

import { useInvestigation } from "@/context/investigation-context";
import { ui } from "@/lib/i18n";

const TIPS = [
  { t: { en: "Pause when you feel pressure", hi: "दबाव महसूस हो तो रुकें" }, d: { en: "Scammers create urgency (\"within 24 hours\", \"account will be blocked\") so you act before thinking. A real organisation will still be there after you verify.", hi: "ठग जल्दबाज़ी बनाते हैं (\"24 घंटे में\", \"खाता ब्लॉक हो जाएगा\") ताकि आप सोचे बिना कदम उठाएँ। असली संस्था आपके जाँचने के बाद भी रहेगी।" } },
  { t: { en: "Never share OTPs, PINs or passwords", hi: "OTP, PIN या पासवर्ड कभी साझा न करें" }, d: { en: "Banks and genuine services never ask for these by message or call, whoever the sender claims to be.", hi: "बैंक और असली सेवाएँ ये संदेश या कॉल पर कभी नहीं माँगतीं, भेजने वाला कोई भी होने का दावा करे।" } },
  { t: { en: "Real jobs and prizes don't charge upfront fees", hi: "असली नौकरी और इनाम पहले शुल्क नहीं माँगते" }, d: { en: "A \"registration\", \"processing\" or \"refundable\" fee before a job, loan or prize is a classic advance-fee scam.", hi: "नौकरी, लोन या इनाम से पहले \"रजिस्ट्रेशन\", \"प्रोसेसिंग\" या \"रिफंडेबल\" शुल्क पुरानी एडवांस-फ़ीस ठगी है।" } },
  { t: { en: "Check the real domain of a link", hi: "लिंक का असली डोमेन देखें" }, d: { en: "The real site is the part just before the first \"/\". \"paypal.com.secure-login.xyz\" belongs to secure-login.xyz, not PayPal. Type official addresses yourself.", hi: "असली साइट पहले \"/\" से ठीक पहले वाला हिस्सा है। \"paypal.com.secure-login.xyz\" secure-login.xyz की है, PayPal की नहीं। आधिकारिक पते खुद टाइप करें।" } },
  { t: { en: "Don't install remote-access apps for strangers", hi: "अजनबियों के कहने पर रिमोट-एक्सेस ऐप न लगाएँ" }, d: { en: "AnyDesk, TeamViewer and similar tools let someone control your device. Support scams depend on them.", hi: "AnyDesk, TeamViewer जैसे ऐप से कोई आपका डिवाइस चला सकता है। सपोर्ट ठगी इन्हीं पर टिकी होती है।" } },
  { t: { en: "If you already shared details or paid", hi: "यदि आप जानकारी साझा कर चुके हैं या भुगतान कर दिया" }, d: { en: "Call your bank immediately to block cards/UPI, change affected passwords, and report it: in India use cybercrime.gov.in or the 1930 cyber-fraud helpline.", hi: "तुरंत बैंक को कॉल करके कार्ड/UPI ब्लॉक कराएँ, प्रभावित पासवर्ड बदलें और रिपोर्ट करें: भारत में cybercrime.gov.in या साइबर-फ्रॉड हेल्पलाइन 1930।" } },
];

export function LearnGuide() {
  const { lang } = useInvestigation();
  return (
    <div>
      <h1 className="text-3xl font-bold">{ui("navLearn", lang)}</h1>
      <p className="mt-2 max-w-2xl text-muted">{lang === "hi" ? "ठगी पहचानने और सुरक्षित रहने के व्यावहारिक कदम।" : "Practical steps to spot scams and stay safe."}</p>
      <ol className="mt-8 grid gap-4 md:grid-cols-2">
        {TIPS.map((x, i) => (
          <li key={i} className="card p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-sm font-semibold text-accent">{i + 1}</span>
              <div><h2 className="font-semibold">{x.t[lang]}</h2><p className="mt-1.5 text-sm leading-relaxed text-muted">{x.d[lang]}</p></div>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-xs text-muted">{lang === "hi" ? "रिपोर्टिंग चैनल आधिकारिक स्रोत से दोबारा जाँचें।" : "Re-check reporting channels against an official source before relying on them."}</p>
    </div>
  );
}
