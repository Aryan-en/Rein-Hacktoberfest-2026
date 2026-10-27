import type { LocalizedText, Recommendation, RiskLevel, Signal } from "../types/investigation";

const L = (en: string, hi: string): LocalizedText => ({ en, hi });

// India reporting channels (National Cyber Crime Reporting Portal and the 1930 helpline) are the
// widely published official channels. Not re-verified against a live source in this build:
// re-check before public launch (tracked in Progress-tracker).
const REPORT = L(
  "Report it: in India use cybercrime.gov.in or call the 1930 cyber-fraud helpline. Also report the sender inside WhatsApp/SMS/email.",
  "रिपोर्ट करें: भारत में cybercrime.gov.in पर या साइबर-फ्रॉड हेल्पलाइन 1930 पर कॉल करें। WhatsApp/SMS/ईमेल में भेजने वाले को भी रिपोर्ट करें।",
);

export function buildRecommendations(risk: RiskLevel, signals: Signal[]): Recommendation[] {
  const ids = new Set(signals.map((s) => s.id));
  const out: Recommendation[] = [];
  const add = (id: string, priority: Recommendation["priority"], text: LocalizedText) => out.push({ id, priority, text });
  const hasUrl = [...ids].some((i) => i.startsWith("url_"));

  if (risk === "high") {
    add("no-engage", "now", L("Do not click any link, open attachments, call back, or reply to this message.", "इस संदेश में दिए किसी लिंक पर क्लिक न करें, अटैचमेंट न खोलें, कॉल बैक या जवाब न दें।"));
    add("no-share", "now", L("Never share OTPs, PINs, passwords, card details or ID numbers. Genuine banks and services never ask for them by message or call.", "OTP, PIN, पासवर्ड, कार्ड या ID की जानकारी कभी साझा न करें। असली बैंक और सेवाएँ इन्हें संदेश या कॉल पर नहीं माँगतीं।"));
    add("already-acted", "now", L("If you already shared details or paid money: call your bank immediately to block cards/UPI and report the transaction, then change affected passwords.", "यदि आपने जानकारी साझा की या पैसे भेजे हैं: तुरंत अपने बैंक को कॉल करके कार्ड/UPI ब्लॉक कराएँ, लेन-देन की रिपोर्ट करें और प्रभावित पासवर्ड बदलें।"));
    add("report", "soon", REPORT);
  } else if (risk === "medium") {
    add("pause", "now", L("Pause. Do not click links or share any information until you have verified this through an official channel.", "रुकें। आधिकारिक माध्यम से पुष्टि करने तक लिंक पर क्लिक न करें और कोई जानकारी साझा न करें।"));
    add("report", "soon", REPORT);
  } else if (risk === "low") {
    add("stay-alert", "info", L("No strong scam indicators were found, but this is not a guarantee of safety. Stay cautious with unexpected requests for money or personal details.", "ठगी के कोई मज़बूत संकेत नहीं मिले, पर यह सुरक्षा की गारंटी नहीं है। पैसे या निजी जानकारी के अनचाहे अनुरोधों से सावधान रहें।"));
  } else {
    add("more-info", "soon", L("Provide the full message text or a clearer screenshot for a better assessment. Until then, treat unexpected requests with caution.", "बेहतर आकलन के लिए पूरा संदेश या साफ़ स्क्रीनशॉट दें। तब तक अनचाहे अनुरोधों को सावधानी से लें।"));
  }

  if (risk !== "low") {
    add("verify-official", "soon", L("Verify independently: open the organisation's official app or type its official website yourself, or call the number printed on your card or on its official site. Do not use contact details from this message.", "स्वतंत्र रूप से जाँचें: संस्था का आधिकारिक ऐप खोलें या उसकी आधिकारिक वेबसाइट खुद टाइप करें, या कार्ड/आधिकारिक साइट पर छपे नंबर पर कॉल करें। इस संदेश के संपर्क विवरण का उपयोग न करें।"));
  }
  if (ids.has("text_credential_request")) add("cred", "now", L("This message asks for secret credentials. Anyone who asks for your OTP, PIN or password is attempting fraud, regardless of who they claim to be.", "इस संदेश में गोपनीय जानकारी माँगी गई है। OTP, PIN या पासवर्ड माँगने वाला व्यक्ति, चाहे वह कोई भी होने का दावा करे, धोखाधड़ी की कोशिश कर रहा है।"));
  if (ids.has("text_advance_fee")) add("fee", "now", L("Legitimate employers, lotteries and lenders do not demand upfront 'registration', 'processing' or 'refundable' fees. Do not pay.", "वैध नियोक्ता, लॉटरी और ऋणदाता पहले 'रजिस्ट्रेशन', 'प्रोसेसिंग' या 'रिफंडेबल' शुल्क नहीं माँगते। भुगतान न करें।"));
  if (ids.has("text_remote_access")) add("remote", "now", L("Do not install remote-access apps at a stranger's request. If you already did, uninstall it, disconnect from the internet and call your bank.", "किसी अजनबी के कहने पर रिमोट-एक्सेस ऐप इंस्टॉल न करें। यदि कर चुके हैं तो उसे हटाएँ, इंटरनेट बंद करें और बैंक को कॉल करें।"));
  if (hasUrl && risk !== "low") add("link", "now", L("Do not open the link. If you need to visit the service, type its official address yourself. TrustLens did not visit this link.", "लिंक न खोलें। यदि सेवा देखनी है तो उसका आधिकारिक पता खुद टाइप करें। TrustLens ने इस लिंक को नहीं खोला।"));
  if (risk === "high" || risk === "medium") add("tell", "info", L("Warn family and friends. Scammers often send the same message to many people.", "परिवार और दोस्तों को सचेत करें। ठग अक्सर वही संदेश कई लोगों को भेजते हैं।"));

  const rank = { now: 0, soon: 1, info: 2 } as const;
  return out.sort((a, b) => rank[a.priority] - rank[b.priority]);
}
