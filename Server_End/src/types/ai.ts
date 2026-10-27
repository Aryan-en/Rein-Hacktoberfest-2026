import type { LocalizedText, ManipulationTechnique, ThreatCategory } from "./investigation";

export interface AiRequest {
  model: string;
  systemInstruction: string;
  userText: string;
  image?: { mimeType: "image/png" | "image/jpeg" | "image/webp"; data: Uint8Array };
  maxOutputTokens: number;
  temperature: number;
  /** Ask the endpoint for JSON mode when supported. */
  jsonMode: boolean;
}

export interface AiRawResponse {
  text: string;
  modelReported?: string;
  usage?: { inputTokens?: number; outputTokens?: number };
  latencyMs: number;
}

export type AiProviderErrorKind =
  | "timeout"
  | "rate_limited"
  | "auth"
  | "bad_request"
  | "server"
  | "safety_blocked"
  | "network";

export class AiProviderError extends Error {
  constructor(
    public kind: AiProviderErrorKind,
    message: string,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

export interface AiProvider {
  readonly id: string;
  generate(req: AiRequest, opts: { signal: AbortSignal }): Promise<AiRawResponse>;
}

export interface ModelFindings {
  schemaVersion: 1;
  category: ThreatCategory;
  aiRisk: "low" | "medium" | "high" | "unknown";
  summary: LocalizedText;
  manipulationTechniques: Array<{ id: ManipulationTechnique; explanation: LocalizedText }>;
  evidence: Array<{ quote: string; why: LocalizedText; technique?: ManipulationTechnique }>;
  extractedText?: string;
  uncertainties: LocalizedText[];
  injectionAttemptDetected: boolean;
}
