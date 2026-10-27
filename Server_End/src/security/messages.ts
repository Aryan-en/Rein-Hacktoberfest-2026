import type { InputSource, LocalizedText, Severity, Signal, SignalClass } from "../types/investigation";

interface Def {
  class: SignalClass;
  severity: Severity;
  title: LocalizedText;
  detail: LocalizedText;
}

const L = (en: string, hi: string): LocalizedText => ({ en, hi });

export const SIGNAL_DEFS: Record<string, Def> = {
  url_ip_host: { class: "observed", severity: "strong", title: L("Link uses a raw IP address", "लिंक में सीधा IP पता है"), detail: L("Legitimate organisations almost always use a named domain. A bare IP address hides who owns the site.", "वैध संस्थाएँ लगभग हमेशा नाम वाला डोमेन इस्तेमाल करती हैं। सीधा IP पता यह छिपा देता है कि साइट किसकी है।") },
  url_userinfo: { class: "observed", severity: "strong", title: L("Link contains a '@' trick", "लिंक में '@' का छलावा है"), detail: L("Text before '@' in a link is ignored by browsers; the real destination is the part after it. Attackers use this to make a link look trustworthy.", "लिंक में '@' से पहले का हिस्सा ब्राउज़र अनदेखा करता है; असली गंतव्य उसके बाद वाला हिस्सा है। हमलावर इससे लिंक को भरोसेमंद दिखाते हैं।") },
  url_punycode: { class: "observed", severity: "weak", title: L("Domain uses internationalised (punycode) characters", "डोमेन में अंतर्राष्ट्रीय (punycode) अक्षर हैं"), detail: L("Some look-alike domains swap letters for similar-looking foreign characters. This alone is not proof, since many genuine sites use them.", "कुछ नकली डोमेन अक्षरों को मिलते-जुलते विदेशी अक्षरों से बदल देते हैं। यह अकेले प्रमाण नहीं है, कई वैध साइटें भी इनका उपयोग करती हैं।") },
  url_mixed_script: { class: "observed", severity: "weak", title: L("Domain mixes writing scripts", "डोमेन में अलग-अलग लिपियाँ मिली हैं"), detail: L("A single word mixing e.g. Latin and Cyrillic letters is a classic look-alike technique.", "एक ही शब्द में लैटिन और सिरिलिक जैसी लिपियों का मेल नकली डोमेन की आम तरकीब है।") },
  url_brand_mismatch: { class: "heuristic", severity: "strong", title: L("Link uses a well-known brand name on an unofficial domain", "लिंक में जाने-माने ब्रांड का नाम है पर डोमेन आधिकारिक नहीं"), detail: L("The address contains a brand name, but its registrable domain is not one of that brand's known official domains. This is a heuristic, not proof.", "पते में ब्रांड का नाम है, लेकिन उसका मुख्य डोमेन उस ब्रांड के ज्ञात आधिकारिक डोमेन में नहीं है। यह एक अनुमान-आधारित संकेत है, प्रमाण नहीं।") },
  url_lookalike_domain: { class: "heuristic", severity: "strong", title: L("Domain closely resembles a well-known brand", "डोमेन किसी जाने-माने ब्रांड से मिलता-जुलता है"), detail: L("The domain differs from an official brand domain by only a character or two (typosquatting pattern).", "यह डोमेन आधिकारिक ब्रांड डोमेन से केवल एक-दो अक्षर अलग है (टाइपो-स्क्वैटिंग का तरीका)।") },
  url_deceptive_subdomain: { class: "heuristic", severity: "strong", title: L("Official-looking domain appears as a subdomain of another site", "आधिकारिक दिखने वाला डोमेन किसी दूसरी साइट के सबडोमेन के रूप में है"), detail: L("The real site is the last part before the first '/'. Here an official name is placed in front of a different domain to mislead.", "असली साइट पहले '/' से ठीक पहले वाला हिस्सा होती है। यहाँ आधिकारिक नाम को किसी अलग डोमेन के आगे लगाकर भ्रमित किया गया है।") },
  url_excess_subdomains: { class: "observed", severity: "weak", title: L("Unusually many subdomain levels", "सबडोमेन के असामान्य रूप से अधिक स्तर"), detail: L("Long chains of subdomains are used to bury the real domain. Common among phishing links, but not exclusive to them.", "लंबी सबडोमेन श्रृंखला असली डोमेन को छिपाने के काम आती है। फ़िशिंग लिंक में आम है, पर केवल उन्हीं में नहीं।") },
  url_shortener: { class: "observed", severity: "weak", title: L("Link uses a URL shortener", "लिंक शॉर्टनर सेवा का है"), detail: L("The final destination is hidden. TrustLens does not open links, so it cannot see where this one leads.", "अंतिम गंतव्य छिपा है। TrustLens लिंक नहीं खोलता, इसलिए यह नहीं देख सकता कि यह कहाँ जाता है।") },
  url_suspicious_tld: { class: "heuristic", severity: "weak", title: L("Domain ends in a high-abuse top-level domain", "डोमेन का अंत ऐसे TLD से है जिसका दुरुपयोग अधिक होता है"), detail: L("Some endings are cheap and widely abused. Many legitimate sites use them too, so this is a weak indicator.", "कुछ डोमेन-अंत सस्ते हैं और अक्सर गलत इस्तेमाल होते हैं। कई वैध साइटें भी इन्हें अपनाती हैं, इसलिए यह कमज़ोर संकेत है।") },
  url_encoding_abuse: { class: "heuristic", severity: "weak", title: L("Link has heavy or nested percent-encoding", "लिंक में भारी या परतदार प्रतिशत-एन्कोडिंग है"), detail: L("Encoding is sometimes used to disguise a destination or smuggle characters such as '@' or '/'.", "एन्कोडिंग कभी-कभी गंतव्य छिपाने या '@' और '/' जैसे अक्षर घुसाने के लिए इस्तेमाल होती है।") },
  url_no_tls: { class: "observed", severity: "weak", title: L("Link is not encrypted (http)", "लिंक एन्क्रिप्टेड नहीं है (http)"), detail: L("Genuine login and payment pages use https. An unencrypted link is a warning sign, though not proof.", "वैध लॉगिन और पेमेंट पेज https उपयोग करते हैं। बिना एन्क्रिप्शन का लिंक चेतावनी है, प्रमाण नहीं।") },
  url_nonstandard_port: { class: "observed", severity: "weak", title: L("Link uses an unusual network port", "लिंक असामान्य नेटवर्क पोर्ट इस्तेमाल करता है"), detail: L("Normal websites use the default web ports. An explicit unusual port can indicate a temporary or throwaway server.", "सामान्य वेबसाइटें डिफ़ॉल्ट पोर्ट इस्तेमाल करती हैं। असामान्य पोर्ट अस्थायी या बेकार सर्वर का संकेत हो सकता है।") },
  url_long_or_hex_path: { class: "observed", severity: "info", title: L("Very long or obfuscated link", "बहुत लंबा या उलझा हुआ लिंक"), detail: L("Long random-looking links can hide tracking or redirect parameters.", "लंबे, बेतरतीब दिखने वाले लिंक में ट्रैकिंग या रीडायरेक्ट पैरामीटर छिपे हो सकते हैं।") },
  url_unparseable: { class: "observed", severity: "info", title: L("Link could not be parsed", "लिंक को पढ़ा नहीं जा सका"), detail: L("The text does not form a valid web address, so no structural checks were possible.", "यह टेक्स्ट वैध वेब पता नहीं बनाता, इसलिए संरचनात्मक जाँच संभव नहीं हुई।") },
  text_urgency: { class: "heuristic", severity: "weak", title: L("Urgency or deadline pressure", "जल्दबाज़ी या समय-सीमा का दबाव"), detail: L("Scammers rush people so they act before thinking. Genuine organisations also send deadlines, so this alone is not proof.", "ठग जल्दी करवाते हैं ताकि आप सोचे बिना कदम उठाएँ। वैध संस्थाएँ भी समय-सीमा भेजती हैं, इसलिए यह अकेले प्रमाण नहीं है।") },
  text_threat: { class: "heuristic", severity: "weak", title: L("Threat of blocking, penalty or arrest", "ब्लॉक, जुर्माने या गिरफ्तारी की धमकी"), detail: L("Fear is a common pressure tactic: account closure, legal action or arrest.", "डर दबाव बनाने की आम तरकीब है: खाता बंद होना, कानूनी कार्रवाई या गिरफ्तारी।") },
  text_credential_request: { class: "heuristic", severity: "strong", title: L("Asks for a secret credential (OTP, PIN, password, card or ID details)", "गोपनीय जानकारी माँगी गई है (OTP, PIN, पासवर्ड, कार्ड या ID विवरण)"), detail: L("Real banks and services never ask you to share OTPs, PINs or passwords by message or call.", "असली बैंक और सेवाएँ संदेश या कॉल पर OTP, PIN या पासवर्ड साझा करने को कभी नहीं कहतीं।") },
  text_advance_fee: { class: "heuristic", severity: "strong", title: L("Asks for an upfront fee or deposit", "पहले से शुल्क या जमा राशि माँगी गई है"), detail: L("Job, prize and loan scams often demand a 'registration', 'processing' or 'refundable' fee before delivering anything.", "नौकरी, इनाम और लोन ठगी में अक्सर कुछ भी देने से पहले 'रजिस्ट्रेशन', 'प्रोसेसिंग' या 'रिफंडेबल' शुल्क माँगा जाता है।") },
  text_payment_request: { class: "heuristic", severity: "weak", title: L("Requests a money transfer or unusual payment method", "पैसे भेजने या असामान्य भुगतान का अनुरोध"), detail: L("Requests to send money, UPI collect requests, gift cards or crypto deserve extra caution.", "पैसे भेजने, UPI कलेक्ट, गिफ़्ट कार्ड या क्रिप्टो के अनुरोधों में अतिरिक्त सावधानी ज़रूरी है।") },
  text_prize_bait: { class: "heuristic", severity: "weak", title: L("Prize, lottery or reward bait", "इनाम, लॉटरी या रिवॉर्ड का लालच"), detail: L("Unexpected winnings are a classic lure to get you to click or pay.", "अचानक इनाम जीतने की बात क्लिक करवाने या भुगतान करवाने का पुराना जाल है।") },
  text_off_platform: { class: "heuristic", severity: "weak", title: L("Pushes you to another app (WhatsApp/Telegram)", "दूसरे ऐप (WhatsApp/Telegram) पर ले जाने की कोशिश"), detail: L("Moving a conversation to a private chat removes platform protections and is common in job and investment scams.", "बातचीत को निजी चैट में ले जाने से प्लेटफ़ॉर्म की सुरक्षा हट जाती है; नौकरी और निवेश ठगी में यह आम है।") },
  text_remote_access: { class: "heuristic", severity: "strong", title: L("Asks you to install a remote-access app", "रिमोट-एक्सेस ऐप इंस्टॉल करने को कहा गया है"), detail: L("Tools such as AnyDesk or TeamViewer let a stranger control your phone or PC. Support scams rely on them.", "AnyDesk या TeamViewer जैसे टूल से कोई अजनबी आपका फ़ोन या PC चला सकता है। सपोर्ट ठगी इन्हीं पर टिकी होती है।") },
  text_authority_claim: { class: "heuristic", severity: "weak", title: L("Claims to be from an authority or official body", "किसी अधिकारी या सरकारी/आधिकारिक संस्था से होने का दावा"), detail: L("Impersonating banks, police, tax or courier firms builds false trust. The claim itself cannot be confirmed from the message alone.", "बैंक, पुलिस, टैक्स या कूरियर कंपनी बनने का नाटक झूठा भरोसा बनाता है। केवल संदेश से यह दावा पुष्ट नहीं किया जा सकता।") },
  hidden_characters: { class: "observed", severity: "weak", title: L("Invisible characters were present", "अदृश्य अक्षर मौजूद थे"), detail: L("Zero-width or direction-control characters can be used to disguise text or hide instructions. They were removed before analysis.", "ज़ीरो-विड्थ या दिशा-नियंत्रक अक्षर टेक्स्ट छिपाने या निर्देश छुपाने के काम आ सकते हैं। विश्लेषण से पहले इन्हें हटा दिया गया।") },
  prompt_injection_attempt: { class: "heuristic", severity: "info", title: L("Text tries to give instructions to an AI", "टेक्स्ट AI को निर्देश देने की कोशिश करता है"), detail: L("The content contains phrases aimed at manipulating AI tools. TrustLens treats all submitted content as data, never as instructions.", "सामग्री में AI टूल्स को भटकाने वाले वाक्यांश हैं। TrustLens सभी सामग्री को केवल डेटा मानता है, निर्देश नहीं।") },
};

export function makeSignal(
  id: string,
  opts: { matched?: string; span?: [number, number] | null; source?: InputSource; severity?: Severity } = {},
): Signal {
  const def = SIGNAL_DEFS[id];
  if (!def) throw new Error(`Unknown signal id: ${id}`);
  return {
    id,
    class: def.class,
    severity: opts.severity ?? def.severity,
    title: def.title,
    detail: def.detail,
    ...(opts.matched !== undefined ? { matched: opts.matched } : {}),
    span: opts.span ?? null,
    source: opts.source ?? "input",
  };
}
