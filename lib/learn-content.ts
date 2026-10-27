import type { LocalizedText } from "./types";

const L = (en: string, hi: string): LocalizedText => ({ en, hi });

export interface ScamType { id: string; name: LocalizedText; how: LocalizedText; flags: LocalizedText[]; doThis: LocalizedText }

export const SCAM_TYPES: ScamType[] = [
  {
    id: "kyc", name: L("Bank KYC / account-block phishing", "बैंक KYC / खाता-ब्लॉक फ़िशिंग"),
    how: L("A message claims your account will be blocked unless you \"update KYC\" through a link.", "संदेश कहता है कि लिंक से \"KYC अपडेट\" न करने पर आपका खाता ब्लॉक हो जाएगा।"),
    flags: [L("Deadline pressure (\"within 24 hours\")", "समय-सीमा का दबाव (\"24 घंटे में\")"), L("Link on a domain that is not the bank's", "ऐसा लिंक जिसका डोमेन बैंक का नहीं है"), L("Asks for OTP, PIN or card details", "OTP, PIN या कार्ड की जानकारी माँगना")],
    doThis: L("Ignore the link. Open your bank's official app or type its website yourself.", "लिंक अनदेखा करें। बैंक का आधिकारिक ऐप खोलें या उसकी वेबसाइट खुद टाइप करें।"),
  },
  {
    id: "job", name: L("Job offer / advance-fee scam", "नौकरी ऑफ़र / अग्रिम-शुल्क ठगी"),
    how: L("An unexpected high-paying work-from-home offer asks for a \"registration\" or \"refundable deposit\".", "अचानक आया ऊँची तनख्वाह वाला घर बैठे काम का ऑफ़र \"रजिस्ट्रेशन\" या \"रिफंडेबल डिपॉज़िट\" माँगता है।"),
    flags: [L("You never applied", "आपने कभी आवेदन नहीं किया"), L("Pay first, earn later", "पहले भुगतान, कमाई बाद में"), L("Moves you to Telegram/WhatsApp", "आपको Telegram/WhatsApp पर ले जाना")],
    doThis: L("Genuine employers never charge candidates. Do not pay; verify on the company's official careers page.", "असली नियोक्ता उम्मीदवारों से शुल्क नहीं लेते। भुगतान न करें; कंपनी के आधिकारिक करियर पेज पर जाँचें।"),
  },
  {
    id: "delivery", name: L("Delivery / customs fee", "डिलीवरी / कस्टम्स शुल्क"),
    how: L("A parcel is \"held\" and a small fee must be paid on a lookalike tracking page.", "पार्सल \"रुका\" बताया जाता है और नकली ट्रैकिंग पेज पर छोटा शुल्क माँगा जाता है।"),
    flags: [L("You are not expecting a parcel", "आप किसी पार्सल की उम्मीद नहीं कर रहे"), L("Tiny fee, card details requested", "छोटा शुल्क, कार्ड विवरण की माँग"), L("Strange tracking domain", "अजीब ट्रैकिंग डोमेन")],
    doThis: L("Track using the courier's official app or website, never through the message link.", "कूरियर के आधिकारिक ऐप या वेबसाइट से ट्रैक करें, संदेश के लिंक से कभी नहीं।"),
  },
  {
    id: "prize", name: L("Lottery / prize claim", "लॉटरी / इनाम का दावा"),
    how: L("You \"won\" something you never entered, but must pay a fee or share details to claim it.", "आप ऐसा कुछ \"जीते\" जिसमें आपने भाग ही नहीं लिया, पर पाने के लिए शुल्क या जानकारी देनी है।"),
    flags: [L("Unexpected winnings", "अचानक इनाम"), L("Processing or tax fee first", "पहले प्रोसेसिंग या टैक्स शुल्क"), L("Urgent claim window", "जल्दी दावा करने की समय-सीमा")],
    doThis: L("Real prizes never require payment. Delete and report.", "असली इनाम के लिए भुगतान नहीं करना पड़ता। हटाएँ और रिपोर्ट करें।"),
  },
  {
    id: "support", name: L("Tech-support / remote access", "टेक-सपोर्ट / रिमोट एक्सेस"),
    how: L("A caller or pop-up says your device or account is compromised and asks you to install a remote-control app.", "कॉल या पॉप-अप कहता है कि आपका डिवाइस या खाता खतरे में है और रिमोट-कंट्रोल ऐप लगाने को कहता है।"),
    flags: [L("Unsolicited contact", "बिना माँगे संपर्क"), L("AnyDesk / TeamViewer request", "AnyDesk / TeamViewer की माँग"), L("Asks you to read out codes", "कोड बोलकर बताने को कहना")],
    doThis: L("Hang up. Never install remote-access tools for someone who contacted you.", "कॉल काट दें। संपर्क करने वाले के कहने पर रिमोट-एक्सेस टूल कभी न लगाएँ।"),
  },
  {
    id: "upi", name: L("UPI refund / collect request", "UPI रिफंड / कलेक्ट रिक्वेस्ट"),
    how: L("Someone offers a \"refund\" but sends a collect request or asks you to enter your UPI PIN.", "कोई \"रिफंड\" का वादा करता है पर कलेक्ट रिक्वेस्ट भेजता है या UPI PIN डालने को कहता है।"),
    flags: [L("You must enter a PIN to receive money", "पैसे पाने के लिए PIN डालना"), L("Collect request instead of payment", "भुगतान की जगह कलेक्ट रिक्वेस्ट"), L("Pressure to act immediately", "तुरंत कदम उठाने का दबाव")],
    doThis: L("You never need a PIN to receive money. Decline the request.", "पैसे पाने के लिए PIN की ज़रूरत नहीं होती। रिक्वेस्ट अस्वीकार करें।"),
  },
];

export const CHECKLIST: LocalizedText[] = [
  L("Was I expecting this message, call or link?", "क्या मैं इस संदेश, कॉल या लिंक की उम्मीद कर रहा था?"),
  L("Does it rush me or threaten me?", "क्या यह मुझे जल्दी करने या डराने की कोशिश करता है?"),
  L("Does it ask for an OTP, PIN, password or upfront money?", "क्या यह OTP, PIN, पासवर्ड या पहले पैसे माँगता है?"),
  L("Is the website's real domain (before the first \"/\") the official one?", "क्या वेबसाइट का असली डोमेन (पहले \"/\" से पहले) आधिकारिक है?"),
  L("Have I verified through the official app or a number I looked up myself?", "क्या मैंने आधिकारिक ऐप या खुद खोजे नंबर से जाँचा?"),
];

export interface QuizItem { text: LocalizedText; scam: boolean; why: LocalizedText }

// Synthetic examples written for teaching; not real messages.
export const QUIZ: QuizItem[] = [
  { text: L("\"Dear customer, your account will be blocked today. Update KYC now: http://sbi-kyc-update.top/login\"", "\"प्रिय ग्राहक, आपका खाता आज ब्लॉक होगा। अभी KYC अपडेट करें: http://sbi-kyc-update.top/login\""), scam: true, why: L("Deadline pressure plus a link on a domain that is not the bank's (.top, hyphenated).", "समय का दबाव और ऐसा लिंक जिसका डोमेन बैंक का नहीं है (.top, हाइफ़न वाला)।") },
  { text: L("\"Your OTP for login is 482913. Valid for 10 minutes. Never share your OTP with anyone.\"", "\"लॉगिन के लिए आपका OTP 482913 है। 10 मिनट मान्य। OTP किसी से साझा न करें।\""), scam: false, why: L("A genuine OTP notice tells you NOT to share it and asks nothing of you.", "असली OTP संदेश इसे साझा न करने को कहता है और आपसे कुछ नहीं माँगता।") },
  { text: L("\"Congratulations! You are selected for work-from-home data entry. Pay a Rs 1,499 refundable registration fee to confirm.\"", "\"बधाई! आप घर बैठे डेटा एंट्री के लिए चुने गए हैं। पुष्टि के लिए Rs 1,499 रिफंडेबल रजिस्ट्रेशन फीस दें।\""), scam: true, why: L("An unsolicited job that charges you upfront is the classic advance-fee scam.", "बिना माँगे आया ऐसा काम जो पहले पैसे माँगे, पुरानी अग्रिम-शुल्क ठगी है।") },
  { text: L("\"Hi, your order #4471 was shipped and arrives Thursday. Track it in the app you ordered from.\"", "\"नमस्ते, आपका ऑर्डर #4471 भेज दिया गया है और गुरुवार को पहुँचेगा। जिस ऐप से मँगाया उसी में ट्रैक करें।\""), scam: false, why: L("No link, no pressure, no payment, and it points you to the app you already use.", "कोई लिंक, दबाव या भुगतान नहीं, और यह आपको उसी ऐप की ओर भेजता है जो आप पहले से इस्तेमाल करते हैं।") },
  { text: L("\"This is customer support. Install AnyDesk and tell me the 9-digit code so I can fix your account.\"", "\"मैं कस्टमर सपोर्ट से हूँ। AnyDesk इंस्टॉल करें और 9 अंकों का कोड बताएँ ताकि मैं आपका खाता ठीक कर सकूँ।\""), scam: true, why: L("Remote-access tools hand a stranger control of your device.", "रिमोट-एक्सेस टूल किसी अजनबी को आपके डिवाइस का नियंत्रण दे देते हैं।") },
  { text: L("\"We will never ask you to share your password or install apps over a call. - Your Bank\"", "\"हम कॉल पर आपसे पासवर्ड साझा करने या ऐप इंस्टॉल करने को कभी नहीं कहेंगे। - आपका बैंक\""), scam: false, why: L("A safety reminder, not a request. The words OTP/password appear only in a warning.", "यह सुरक्षा चेतावनी है, अनुरोध नहीं। पासवर्ड जैसे शब्द केवल चेतावनी में हैं।") },
];
