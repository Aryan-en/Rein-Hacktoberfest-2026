import type { LocalizedText } from "@/lib/types";

const L = (en: string, hi: string): LocalizedText => ({ en, hi });

export const NAV = [
  { href: "#features", label: L("Features", "सुविधाएँ") },
  { href: "#how", label: L("How it works", "यह कैसे काम करता है") },
  { href: "#trust", label: L("Evidence model", "सबूत का मॉडल") },
  { href: "#faq", label: L("FAQ", "सवाल-जवाब") },
];

export const HERO = {
  badge: L("Open source · Open-weight AI · English + हिन्दी", "ओपन सोर्स · ओपन-वेट AI · अंग्रेज़ी + हिन्दी"),
  title: L("Understand the threat. Verify the evidence. Stay protected.", "खतरे को समझें। सबूत जाँचें। सुरक्षित रहें।"),
  sub: L("Paste a suspicious message, link or screenshot. TrustLens shows exactly what looks wrong, how it knows, and what it cannot tell you.", "कोई संदिग्ध संदेश, लिंक या स्क्रीनशॉट चिपकाएँ। TrustLens बताता है कि क्या गड़बड़ दिखता है, यह कैसे पता चला, और क्या वह नहीं बता सकता।"),
  cta: L("Start investigating", "जाँच शुरू करें"),
  cta2: L("See a sample report", "नमूना रिपोर्ट देखें"),
  points: [L("No account needed", "खाते की ज़रूरत नहीं"), L("Links are never opened", "लिंक कभी नहीं खोले जाते"), L("Your content isn't stored", "आपकी सामग्री सहेजी नहीं जाती")],
};

export const TRUST_STRIP = [
  { t: L("Open source", "ओपन सोर्स"), d: L("Read every rule and prompt", "हर नियम और प्रॉम्प्ट पढ़ें") },
  { t: L("Open-weight AI", "ओपन-वेट AI"), d: L("Gemma and similar open models; reports name the one that ran", "Gemma जैसे ओपन मॉडल; रिपोर्ट बताती है कौन सा चला") },
  { t: L("Rules first", "पहले नियम"), d: L("Deterministic checks run before AI", "AI से पहले नियम-आधारित जाँच") },
  { t: L("EN + हिन्दी", "EN + हिन्दी"), d: L("Every report in both languages", "हर रिपोर्ट दोनों भाषाओं में") },
];

export const FEATURES = [
  { icon: "evidence", t: L("Evidence, not guesses", "अनुमान नहीं, सबूत"), d: L("Every verdict lists the exact phrases that triggered it, highlighted in your message.", "हर निष्कर्ष उन सटीक वाक्यांशों को दिखाता है जिनसे वह निकला, आपके संदेश में रंगीन करके।") },
  { icon: "link", t: L("URL forensics", "लिंक फ़ोरेंसिक्स"), d: L("Spot lookalike domains, '@' tricks, raw IPs and shorteners from the link's structure alone. We never open it.", "लिंक की बनावट से ही नकली डोमेन, '@' चाल, सीधे IP और शॉर्टनर पहचानें। हम उसे कभी नहीं खोलते।") },
  { icon: "scale", t: L("Explainable risk", "समझने योग्य जोखिम"), d: L("Low, Medium, High or Unknown with the reasons shown. No made-up percentage scores.", "कम, मध्यम, उच्च या अज्ञात, कारणों के साथ। कोई मनगढ़ंत प्रतिशत स्कोर नहीं।") },
  { icon: "image", t: L("Screenshot understanding", "स्क्रीनशॉट की समझ"), d: L("Read text from chat or payment screenshots (needs a vision-capable model to be enabled).", "चैट या पेमेंट स्क्रीनशॉट का टेक्स्ट पढ़ें (विज़न-सक्षम मॉडल चालू होने पर)।") },
  { icon: "lang", t: L("English and Hindi", "अंग्रेज़ी और हिन्दी"), d: L("Explanations, evidence and safety steps in both languages, one click apart.", "व्याख्या, सबूत और सुरक्षा कदम दोनों भाषाओं में, एक क्लिक की दूरी पर।") },
  { icon: "lock", t: L("Private by design", "डिज़ाइन से निजी"), d: L("No history stored on the server. Investigations live in your browser tab only.", "सर्वर पर कोई इतिहास नहीं। जाँचें केवल आपके ब्राउज़र टैब में रहती हैं।") },
];

export const STEPS = [
  { t: L("Submit", "जमा करें"), d: L("Paste text, a link, or upload a screenshot.", "टेक्स्ट, लिंक चिपकाएँ या स्क्रीनशॉट अपलोड करें।") },
  { t: L("Rules run first", "पहले नियम चलते हैं"), d: L("Deterministic checks inspect the link structure and scam language.", "नियम-आधारित जाँच लिंक की बनावट और ठगी वाली भाषा देखती है।") },
  { t: L("AI interprets", "AI व्याख्या करता है"), d: L("An open-weight model explains the context. Your content is treated as data, never as instructions.", "ओपन-वेट मॉडल संदर्भ समझाता है। आपकी सामग्री डेटा है, निर्देश नहीं।") },
  { t: L("Verify and report", "सत्यापन और रिपोर्ट"), d: L("Every AI quote is matched against your text. Unverifiable claims can't raise the risk.", "AI के हर उद्धरण को आपके टेक्स्ट से मिलाया जाता है। असत्यापित दावे जोखिम नहीं बढ़ा सकते।") },
];

export const EVIDENCE = [
  { k: "observed", t: L("Observed", "देखा गया"), d: L("A literal fact found by code, like \"the host is an IP address\".", "कोड द्वारा मिला सीधा तथ्य, जैसे \"होस्ट एक IP पता है\"।"), tone: "text-blue border-blue/40 bg-blue/10" },
  { k: "heuristic", t: L("Heuristic indicator", "अनुमान-आधारित संकेत"), d: L("A pattern that often appears in scams. A warning sign, not proof.", "ऐसा पैटर्न जो ठगी में अक्सर दिखता है। चेतावनी है, प्रमाण नहीं।"), tone: "text-medium border-medium/40 bg-medium/10" },
  { k: "ai", t: L("AI interpretation", "AI की व्याख्या"), d: L("The model's reading of context. It only counts when its quote exists in your text.", "संदर्भ की मॉडल की समझ। तभी गिनी जाती है जब उसका उद्धरण आपके टेक्स्ट में हो।"), tone: "text-accent border-accent/40 bg-accent/10" },
  { k: "verified", t: L("Independently verified", "स्वतंत्र रूप से सत्यापित"), d: L("Confirmed by an outside authority. TrustLens makes no external lookups yet, so it claims none.", "किसी बाहरी प्राधिकरण से पुष्ट। TrustLens अभी बाहरी जाँच नहीं करता, इसलिए कोई दावा नहीं।"), tone: "text-muted border-line-strong bg-surface-2" },
];

export const COMPARE: Array<{ a: LocalizedText; b: LocalizedText }> = [
  { a: L("One opaque percentage", "एक अस्पष्ट प्रतिशत"), b: L("A label plus the reasons behind it", "एक लेबल और उसके कारण") },
  { a: L("AI output shown as-is", "AI का आउटपुट जैसा है वैसा"), b: L("AI output validated; every quote checked against your text", "AI आउटपुट सत्यापित; हर उद्धरण आपके टेक्स्ट से मिलाया जाता है") },
  { a: L("Fetches the link to \"scan\" it", "लिंक खोलकर \"स्कैन\" करता है"), b: L("Never opens, resolves or fetches your link", "आपका लिंक कभी नहीं खोलता या फ़ेच करता") },
  { a: L("Silent model swaps", "चुपचाप मॉडल बदलना"), b: L("Every report states which model actually ran", "हर रिपोर्ट बताती है कि कौन सा मॉडल चला") },
  { a: L("\"Safe\" badge", "\"सुरक्षित\" बैज"), b: L("Low means \"no strong indicators found\", never \"safe\"", "कम का मतलब \"कोई मज़बूत संकेत नहीं\", कभी \"सुरक्षित\" नहीं") },
  { a: L("English only", "केवल अंग्रेज़ी"), b: L("English and Hindi from one analysis", "एक ही जाँच से अंग्रेज़ी और हिन्दी") },
];

export const FAQ: Array<{ q: LocalizedText; a: LocalizedText }> = [
  { q: L("Do I need an account?", "क्या मुझे खाता चाहिए?"), a: L("No. Everything works as a guest. An optional account only gives you a higher request allowance; it never stores your investigations.", "नहीं। अतिथि के रूप में सब कुछ चलता है। वैकल्पिक खाता केवल अधिक अनुरोध सीमा देता है; आपकी जाँचें कभी सहेजी नहीं जातीं।") },
  { q: L("Does TrustLens open the links I submit?", "क्या TrustLens मेरे दिए लिंक खोलता है?"), a: L("Never. It reads the link's structure only, so it can't confirm what the page contains or who owns it.", "कभी नहीं। वह केवल लिंक की बनावट पढ़ता है, इसलिए पेज की सामग्री या मालिक की पुष्टि नहीं कर सकता।") },
  { q: L("Does \"Low risk\" mean it's safe?", "क्या \"कम जोखिम\" का मतलब सुरक्षित है?"), a: L("No. It means no strong scam indicators were found. Always verify through an official app or number.", "नहीं। इसका मतलब है कि ठगी के कोई मज़बूत संकेत नहीं मिले। हमेशा आधिकारिक ऐप या नंबर से जाँचें।") },
  { q: L("Which AI does it use?", "यह कौन सा AI इस्तेमाल करता है?"), a: L("Open-weight models: by default Google's Gemma through the Gemini API (other providers can be configured). Each report shows the model that ran, and if AI is unavailable it says so and falls back to rules only.", "ओपन-वेट मॉडल: डिफ़ॉल्ट रूप से Gemini API के ज़रिए Google का Gemma (अन्य प्रदाता कॉन्फ़िगर हो सकते हैं)। हर रिपोर्ट चला हुआ मॉडल दिखाती है, और AI उपलब्ध न हो तो बताकर केवल नियमों पर लौट आती है।") },
  { q: L("Where does my content go?", "मेरी सामग्री कहाँ जाती है?"), a: L("TrustLens doesn't store it. When AI is on, the text is sent to the model provider to be analysed, so redact OTPs and personal details first.", "TrustLens उसे सहेजता नहीं। AI चालू होने पर विश्लेषण के लिए टेक्स्ट मॉडल प्रदाता को भेजा जाता है, इसलिए पहले OTP और निजी जानकारी हटा दें।") },
  { q: L("I already lost money. What now?", "मैं पैसे खो चुका हूँ। अब क्या?"), a: L("Call your bank immediately to block cards/UPI, then report it. See the Resources page for official channels.", "तुरंत बैंक को कॉल करके कार्ड/UPI ब्लॉक कराएँ, फिर रिपोर्ट करें। आधिकारिक चैनल के लिए संसाधन पेज देखें।") },
];
