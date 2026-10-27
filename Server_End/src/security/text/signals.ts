import type { InputSource, Signal } from "../../types/investigation";
import { makeSignal } from "../messages";

interface Rule {
  id: string;
  patterns: RegExp[];
  /** Matches within this many chars before the hit cancel it (e.g. "never", "no fee"). */
  negation?: { re: RegExp; window: number };
}

// Negation must sit directly before the match (at most one filler word), so that
// "Do not delay. Share your OTP" is NOT treated as negated but "Never share your OTP" is.
const NEG_WORDS = "(?:\\bnever|\\bdo not|\\bdon'?t|\\bdont|\\bshould not|\\bshouldn'?t|\\bmust not|\\bnot to|\\bno need to|\\bkabhi nahi|\\bnahi|\\bmat|कभी नहीं|मत)";
const negRe = (maxWords: number) => new RegExp(`${NEG_WORDS}\\s+(?:[\\p{L}']+\\s+){0,${maxWords}}$`, "iu");
const NEG_GENERAL = negRe(1); // tight: "Do not delay. Share your OTP" must NOT count as negated
const NEG_LOOSE = negRe(5); // "We will never ask you to install AnyDesk"
// "We will never ask you to install X or share your password": negation carries across a coordinator.
const NEG_CONJ = new RegExp(`${NEG_WORDS}\\s+(?:[\\p{L}']+\\s+){0,6}(?:or|and|ya|aur)\\s+(?:[\\p{L}']+\\s+){0,1}$`, "iu");
const NEG_FEE = /(?:\bno|\bnot|\bzero|\bwithout|\bfree of|\bnever|\bnahi|कोई|नहीं)\s+(?:[\p{L}']+\s+){0,1}$/iu;

const W = (s: string) => new RegExp(s, "giu");

const RULES: Rule[] = [
  {
    id: "text_urgency",
    patterns: [
      W("\\b(?:immediately|urgent(?:ly)?|right now|asap|act now|hurry|last chance|final (?:notice|warning|reminder)|limited time|today only|expires? (?:today|soon|in|within))\\b"),
      W("\\bwithin\\s+\\d{1,3}\\s*(?:hours?|hrs?|minutes?|mins?|days?)\\b"),
      W("\\b(?:abhi|turant|jaldi|aaj hi|fauran)\\b"),
      W("(?:तुरंत|अभी|जल्दी|आज ही|फौरन|२४ घंटे|24 घंटे)"),
    ],
  },
  {
    id: "text_threat",
    patterns: [
      W("\\b(?:account|card|sim|number|service|wallet|upi|kyc)\\b[^.\\n]{0,40}\\b(?:(?:will be|is|has been|gets?|shall be)\\s+)?(?:blocked|suspended|closed|deactivated|frozen|disconnected|terminated|cancel+ed|restricted)\\b"),
      W("\\b(?:legal action|arrest(?:ed)?|warrant|fir\\b|penalty|police case|court notice|prosecution|seized)\\b"),
      W("(?:ब्लॉक|बंद हो|गिरफ्तार|कानूनी कार्रवाई|जुर्माना|वारंट)"),
      W("\\b(?:band ho (?:jayega|jaega)|block ho (?:jayega|jaega))\\b"),
    ],
  },
  {
    id: "text_prize_bait",
    patterns: [
      W("\\b(?:lottery|lucky draw|jackpot|you (?:have )?won|you are (?:the )?(?:winner|selected)|congratulations[^.\\n]{0,40}(?:won|prize|reward|selected)|claim (?:your )?(?:prize|reward|gift|cashback)|reward points? (?:expire|will expire))\\b"),
      W("(?:लॉटरी|इनाम|जीत(?:े|ा|ी)|बधाई[^.\\n]{0,40}(?:इनाम|जीत))"),
    ],
  },
  {
    id: "text_off_platform",
    patterns: [
      W("\\b(?:message|contact|text|chat|dm|reach|join|add)\\s+(?:me |us |him |her )?(?:on|at|via|through|in)\\s+(?:whats\\s?app|telegram|signal)\\b"),
      W("\\b(?:wa\\.me|t\\.me)/[^\\s]+"),
      W("\\b(?:whats\\s?app|telegram)\\s+(?:group|channel|number|no\\.?)\\b"),
      W("(?:व्हाट्सएप|टेलीग्राम)\\s*(?:पर|ग्रुप|चैनल)"),
    ],
  },
  {
    id: "text_remote_access",
    patterns: [W("\\b(?:any\\s?desk|team\\s?viewer|quick\\s?support|rust\\s?desk|ultra\\s?viewer|air\\s?droid|remote (?:access|support|desktop) (?:app|software|tool)|screen[- ]?shar(?:e|ing) app)\\b")],
    negation: { re: NEG_LOOSE, window: 48 },
  },
  {
    id: "text_authority_claim",
    patterns: [
      W("\\b(?:rbi|income[- ]tax(?: department)?|it department|customs(?: department| officer)?|cyber ?(?:cell|crime)|cbi|trai|narcotics|kyc (?:team|update|verification|expired|pending)|customer (?:care|support)|support team|hr (?:manager|department|team|executive)|bank (?:manager|officer|executive)|police (?:officer|department|station)|courier (?:company|service|executive)|electricity board)\\b"),
      W("(?:आयकर विभाग|साइबर सेल|पुलिस विभाग|केवाईसी|ग्राहक सेवा)"),
    ],
  },
  {
    id: "text_advance_fee",
    patterns: [
      W("\\b(?:registration|processing|joining|security|refundable|verification|clearance|customs|delivery|insurance|activation|training|admission|service|gst|tax|unlock|release|courier)\\s+(?:fees?|charges?|deposit|amount|payment)\\b"),
      W("\\b(?:pay|send|deposit|transfer)\\s+(?:a\\s+|an\\s+|the\\s+)?(?:small\\s+|nominal\\s+|one[- ]time\\s+)?(?:fee|deposit|amount|charges?)\\b[^.\\n]{0,40}\\b(?:to (?:claim|receive|release|unlock|activate|get|start|join|process)|before)\\b"),
      W("(?:रजिस्ट्रेशन|प्रोसेसिंग|जॉइनिंग|सिक्योरिटी|रिफंडेबल)\\s*(?:फीस|शुल्क|चार्ज|राशि|डिपॉजिट)"),
      W("\\b(?:registration|processing|joining) fees?\\s+(?:jama|bhej|pay)\\b"),
    ],
    negation: { re: NEG_FEE, window: 18 },
  },
  {
    id: "text_payment_request",
    patterns: [
      W("\\b(?:send|transfer|pay|deposit|remit)\\b[^.\\n]{0,40}(?:₹|rs\\.?|inr|\\$|usd|rupees)\\s?\\d"),
      W("\\b(?:upi collect|collect request|gift ?cards?|itunes card|google play card|bitcoin|crypto(?:currency)?|usdt|western union)\\b"),
      W("(?:पैसे|रुपये|राशि)\\s*(?:भेज|ट्रांसफर|जमा)"),
      W("\\b(?:paise|rupay[ae]|amount)\\s+(?:bhej|transfer|jama)\\w*"),
    ],
    negation: { re: NEG_LOOSE, window: 48 },
  },
];

const INJECTION: RegExp[] = [
  W("\\bignore (?:all |any |the )?(?:previous|prior|above|earlier) (?:instructions?|prompts?|rules?)\\b"),
  W("\\b(?:disregard|forget|override) (?:all |any |the |your )?(?:previous |prior |above )?(?:instructions?|rules?|guidelines?|system prompt)\\b"),
  W("\\bsystem prompt\\b"),
  W("\\byou are now\\b"),
  W("\\b(?:respond|reply|answer|output) (?:only )?with\\b[^.\\n]{0,40}\\b(?:safe|low|json|no risk|legitimate)\\b"),
  W("\\b(?:classify|mark|rate|label) (?:this|it|the (?:message|content)) as (?:safe|low|legit(?:imate)?|harmless|benign)\\b"),
  W("\\bas an ai\\b|\\bnew instructions?:"),
  W("</?(?:system|assistant|instructions?)>|\\[/?(?:INST|SYS)\\]|<<<[^>]{0,40}(?:END_)?UNTRUSTED"),
];

const CRED_NOUN = W(
  "\\b(?:otp|one[- ]time (?:password|pin|code)|verification code|pin|upi pin|atm pin|mpin|cvv|cvc|password|passcode|card (?:number|details)|debit card|credit card|net ?banking (?:id|password|details)|login (?:details|credentials|id)|aadhaar|aadhar|pan (?:card|number)|date of birth|account number|secret code)\\b|ओटीपी|पिन|पासवर्ड|आधार|कार्ड (?:नंबर|विवरण)",
);
const CRED_VERB = W(
  "\\b(?:share|send|provide|enter|submit|tell|give|confirm|verify|update|forward|reply(?: with)?|type|fill|read out|bata(?:o|iye|na)?|bhej(?:o|iye|na)?|de(?:do|na)|dijiye|batayein)\\b|बता(?:एं|इए|ओ)|भेज(?:ें|िए|ो)|दें|दीजिए|साझा",
);

function negated(text: string, matchStart: number, rule: { re: RegExp; window: number }): boolean {
  const from = Math.max(0, matchStart - rule.window);
  return rule.re.test(text.slice(from, matchStart));
}

const MAX_PER_ID = 3;

export function detectTextSignals(text: string, source: InputSource = "input"): Signal[] {
  const out: Signal[] = [];

  for (const rule of RULES) {
    let count = 0;
    for (const re of rule.patterns) {
      re.lastIndex = 0;
      for (const m of text.matchAll(re)) {
        const start = m.index ?? 0;
        if (rule.negation && negated(text, start, rule.negation)) continue;
        out.push(makeSignal(rule.id, { matched: m[0], span: [start, start + m[0].length], source }));
        if (++count >= MAX_PER_ID) break;
      }
      if (count >= MAX_PER_ID) break;
    }
  }

  // Credential request: a secret-noun near a request verb, with a negation guard before the verb.
  let credCount = 0;
  CRED_NOUN.lastIndex = 0;
  for (const nm of text.matchAll(CRED_NOUN)) {
    if (credCount >= MAX_PER_ID) break;
    const ns = nm.index ?? 0;
    const ne = ns + nm[0].length;
    const from = Math.max(0, ns - 60);
    const to = Math.min(text.length, ne + 60);
    const windowText = text.slice(from, to);
    CRED_VERB.lastIndex = 0;
    let fired = false;
    for (const vm of windowText.matchAll(CRED_VERB)) {
      const vs = from + (vm.index ?? 0);
      if (negated(text, vs, { re: NEG_GENERAL, window: 28 }) || negated(text, vs, { re: NEG_CONJ, window: 70 })) continue;
      // "Your OTP is 1234" style notices without a request verb never reach here.
      const s = Math.min(vs, ns);
      const e = Math.max(vs + vm[0].length, ne);
      out.push(makeSignal("text_credential_request", { matched: text.slice(s, e), span: [s, e], source }));
      fired = true;
      break;
    }
    if (fired) credCount++;
  }

  let inj = 0;
  for (const re of INJECTION) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      if (inj++ >= MAX_PER_ID) break;
      const start = m.index ?? 0;
      out.push(makeSignal("prompt_injection_attempt", { matched: m[0], span: [start, start + m[0].length], source }));
    }
  }
  return out;
}
