import { randomUUID } from "node:crypto";
import { buildImagePrompt, buildSystemInstruction, buildTextPrompt, newNonce } from "../ai/prompts";
import { runInference, type InferenceResult } from "../ai/orchestrator";
import { countMeaningfulChars, normalizeText } from "../security/normalize";
import { makeSignal } from "../security/messages";
import { detectTextSignals } from "../security/text/signals";
import { extractUrls } from "../security/url/extract";
import { analyzeUrl } from "../security/url/heuristics";
import type { AiProvider, ModelFindings } from "../types/ai";
import type { InputSource, InvestigationReport, LocalizedText, Signal, UrlAnalysis } from "../types/investigation";
import { MAX_URL_CHARS, MIN_MEANINGFUL_CHARS } from "../validation/limits";
import { classify } from "./classify";
import { buildRecommendations } from "./recommendations";
import { signalsToEvidence, verifyAiEvidence } from "./verify-evidence";

export type InvestigateInput =
  | { type: "text"; text: string }
  | { type: "url"; url: string }
  | { type: "image"; bytes: Uint8Array; mimeType: "image/png" | "image/jpeg" | "image/webp"; note?: string };

export interface PipelineConfig {
  primaryModel: string;
  fallbackModel: string | null;
  visionModels: string[];
  maxTextChars: number;
  modelTimeoutMs: number;
  jsonMode: boolean;
}

export interface PipelineDeps {
  provider: AiProvider | null;
  config: PipelineConfig;
  /** Test seam. */
  inference?: typeof runInference;
}

export class ImageAnalysisUnavailableError extends Error {
  constructor() {
    super("Screenshot analysis requires a vision-capable model, which is not configured.");
    this.name = "ImageAnalysisUnavailableError";
  }
}

const L = (en: string, hi: string): LocalizedText => ({ en, hi });

const STANDING_LIMITATIONS: LocalizedText[] = [
  L("TrustLens does not open links or contact senders, so it cannot confirm what a site contains or who owns it.", "TrustLens लिंक नहीं खोलता और भेजने वाले से संपर्क नहीं करता, इसलिए वह साइट की सामग्री या मालिक की पुष्टि नहीं कर सकता।"),
  L("Indicators are patterns, not proof of fraud.", "संकेत केवल पैटर्न हैं, धोखाधड़ी का प्रमाण नहीं।"),
  L("AI interpretation can be wrong and is not independent verification.", "AI की व्याख्या गलत हो सकती है और यह स्वतंत्र सत्यापन नहीं है।"),
  L("A Low result does not mean the content is safe.", "कम जोखिम का मतलब यह नहीं कि सामग्री सुरक्षित है।"),
];
const OCR_LIMITATION = L("Screenshot text is machine-read and may contain errors.", "स्क्रीनशॉट का टेक्स्ट मशीन द्वारा पढ़ा गया है और उसमें गलतियाँ हो सकती हैं।");

const URL_MODE_TEXT_SIGNALS = new Set(["prompt_injection_attempt"]);

function collectSignals(text: string, source: InputSource, mode: "text" | "url", hidden: boolean) {
  const signals: Signal[] = [];
  const urls: UrlAnalysis[] = [];
  let omitted = 0;
  if (hidden) signals.push(makeSignal("hidden_characters", { source }));

  if (mode === "text") {
    signals.push(...detectTextSignals(text, source));
    const ex = extractUrls(text);
    omitted = ex.omitted;
    for (const c of ex.urls) urls.push(analyzeUrl(c.raw, c.span, source));
  } else {
    signals.push(...detectTextSignals(text, source).filter((s) => URL_MODE_TEXT_SIGNALS.has(s.id)));
    const ex = extractUrls(text);
    if (ex.urls.length > 0) {
      omitted = ex.omitted;
      for (const c of ex.urls) urls.push(analyzeUrl(c.raw, c.span, source));
    } else {
      urls.push(analyzeUrl(text.trim(), [0, text.trim().length], source));
    }
  }
  for (const u of urls) signals.push(...u.signals);
  return { signals, urls, omitted };
}

export async function investigate(input: InvestigateInput, deps: PipelineDeps): Promise<InvestigationReport> {
  const t0 = Date.now();
  const cfg = deps.config;
  const infer = deps.inference ?? runInference;
  const nonce = newNonce();
  const textModels = [cfg.primaryModel, ...(cfg.fallbackModel ? [cfg.fallbackModel] : [])];

  let displayText = "";
  let source: InputSource = "input";
  let hidden = false;
  let truncated = false;
  let inference: InferenceResult;
  let preSignals: ReturnType<typeof collectSignals> | null = null;
  const uncertainties: LocalizedText[] = [];

  if (input.type === "image") {
    if (cfg.visionModels.length === 0) throw new ImageAnalysisUnavailableError();
    source = "ocr";
    inference = await infer(
      {
        models: cfg.visionModels,
        systemInstruction: buildSystemInstruction({ image: true }),
        userText: buildImagePrompt({ ...(input.note ? { note: input.note } : {}), nonce }),
        image: { mimeType: input.mimeType, data: input.bytes },
      },
      { provider: deps.provider, timeoutMs: cfg.modelTimeoutMs, jsonMode: cfg.jsonMode },
    );
    const n = normalizeText(inference.findings?.extractedText ?? "", cfg.maxTextChars);
    displayText = n.text;
    hidden = n.hiddenCharactersRemoved;
    truncated = n.truncated;
    preSignals = collectSignals(displayText, "ocr", "text", hidden);
  } else {
    const isUrl = input.type === "url";
    const n = normalizeText(isUrl ? input.url : input.text, isUrl ? MAX_URL_CHARS : cfg.maxTextChars);
    displayText = n.text;
    hidden = n.hiddenCharactersRemoved;
    truncated = n.truncated;
    preSignals = collectSignals(displayText, "input", isUrl ? "url" : "text", hidden);
    inference = await infer(
      {
        models: textModels,
        systemInstruction: buildSystemInstruction({ image: false }),
        userText: buildTextPrompt({ content: displayText, signals: preSignals.signals, nonce, kind: isUrl ? "url" : "message" }),
      },
      { provider: deps.provider, timeoutMs: cfg.modelTimeoutMs, jsonMode: cfg.jsonMode },
    );
  }

  const findings: ModelFindings | null = inference.findings;
  const { signals, urls, omitted } = preSignals;

  // The model flagged an injection attempt that our lexical detector did not see.
  if (findings?.injectionAttemptDetected && !signals.some((s) => s.id === "prompt_injection_attempt")) {
    signals.push(makeSignal("prompt_injection_attempt", { source }));
  }

  const ai = verifyAiEvidence(findings, displayText, source);
  const evidence = [...signalsToEvidence(signals), ...ai.items];

  const charsMeaningful = countMeaningfulChars(displayText);
  const insufficient =
    input.type === "url"
      ? urls.every((u) => !u.parsed)
      : charsMeaningful < MIN_MEANINGFUL_CHARS && urls.length === 0;

  const classification = classify({ signals, findings, verifiedEvidenceCount: ai.verifiedCount, insufficientInput: insufficient });

  if (findings) uncertainties.push(...findings.uncertainties);
  if (truncated) uncertainties.push(L(`The input was longer than the limit and was truncated to ${displayText.length} characters.`, `इनपुट सीमा से लंबा था और ${displayText.length} अक्षरों तक छोटा किया गया।`));
  if (omitted > 0) uncertainties.push(L(`${omitted} additional link(s) were not analysed (limit reached).`, `${omitted} अतिरिक्त लिंक का विश्लेषण नहीं हुआ (सीमा पूरी)।`));
  if (input.type === "image" && !findings) uncertainties.push(L("The screenshot could not be read because AI analysis was unavailable.", "AI विश्लेषण उपलब्ध न होने से स्क्रीनशॉट पढ़ा नहीं जा सका।"));
  if (input.type === "image" && findings && charsMeaningful < MIN_MEANINGFUL_CHARS) uncertainties.push(L("Very little text could be read from the image.", "छवि से बहुत कम टेक्स्ट पढ़ा जा सका।"));

  const limitations = [...STANDING_LIMITATIONS, ...(input.type === "image" ? [OCR_LIMITATION] : [])];
  const totalMs = Date.now() - t0;

  return {
    schemaVersion: 1,
    reportId: randomUUID(),
    generatedAt: new Date().toISOString(),
    input: {
      type: input.type,
      displayText,
      textSource: source === "ocr" ? "ocr" : "user",
      charCount: displayText.length,
      truncated,
      hiddenCharactersRemoved: hidden,
    },
    classification,
    signals,
    urls,
    evidence,
    manipulationTechniques: (findings?.manipulationTechniques ?? []).map((t) => ({ id: t.id, explanation: t.explanation, provenance: "ai_interpretation" as const })),
    explanation: findings ? { summary: findings.summary } : null,
    recommendations: buildRecommendations(classification.risk, signals),
    limitations,
    uncertainties,
    model: inference.disclosure,
    timings: { totalMs, modelMs: inference.modelMs },
  };
}
