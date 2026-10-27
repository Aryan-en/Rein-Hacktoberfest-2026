import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { AiProviderError, type AiProvider, type AiRawResponse, type AiRequest } from "../../types/ai";

/** Minimal surface of the Google GenAI client that we use; lets tests inject a fake. */
export interface GeminiClient {
  models: { generateContent(params: any): Promise<any> };
}

export function createGeminiClient(apiKey: string): GeminiClient {
  return new GoogleGenAI({ apiKey }) as unknown as GeminiClient;
}

function mapError(e: unknown): AiProviderError {
  if (e instanceof AiProviderError) return e;
  const err = e as { name?: string; status?: number; message?: string };
  if (err?.name === "AbortError" || /aborted/i.test(String(err?.message ?? ""))) return new AiProviderError("timeout", "Model request timed out or was aborted.");
  const s = err?.status;
  if (s === 401 || s === 403) return new AiProviderError("auth", "Provider rejected the credentials.");
  if (s === 429) return new AiProviderError("rate_limited", "Provider rate limit or quota reached.");
  if (s === 400 || s === 404 || s === 422) return new AiProviderError("bad_request", `Provider rejected the request (${s}).`);
  if (typeof s === "number" && s >= 500) return new AiProviderError("server", `Provider error (${s}).`);
  return new AiProviderError("network", "Could not reach the model provider.");
}

/**
 * Google Gemini API adapter (serves the open-weight Gemma family, e.g. gemma-4-31b-it).
 * Only file that imports `@google/genai`. Nothing here logs prompts or responses.
 */
export class GeminiProvider implements AiProvider {
  readonly id = "gemini-api";
  constructor(private client: GeminiClient) {}

  async generate(req: AiRequest, opts: { signal: AbortSignal }): Promise<AiRawResponse> {
    const started = Date.now();
    const parts: unknown[] = [{ text: req.userText }];
    if (req.image) parts.push({ inlineData: { mimeType: req.image.mimeType, data: Buffer.from(req.image.data).toString("base64") } });

    const base = {
      model: req.model,
      contents: [{ role: "user", parts }],
    };
    const config = (rich: boolean) => ({
      systemInstruction: req.systemInstruction,
      temperature: req.temperature,
      maxOutputTokens: req.maxOutputTokens,
      abortSignal: opts.signal,
      // Optional niceties that not every model accepts; dropped on a 400 and retried once.
      ...(rich && req.jsonMode ? { responseMimeType: "application/json" } : {}),
      ...(rich ? { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } } : {}),
    });

    let res: any;
    try {
      try {
        res = await this.client.models.generateContent({ ...base, config: config(true) });
      } catch (e) {
        const st = (e as { status?: number }).status;
        if (st === 400) res = await this.client.models.generateContent({ ...base, config: config(false) });
        else throw e;
      }
    } catch (e) {
      throw mapError(e);
    }

    const block = res?.promptFeedback?.blockReason;
    const finish = res?.candidates?.[0]?.finishReason;
    if (block || finish === "SAFETY" || finish === "PROHIBITED_CONTENT") throw new AiProviderError("safety_blocked", "Response blocked by provider safety filter.");
    const text: unknown = res?.text;
    if (typeof text !== "string" || text.trim() === "") throw new AiProviderError("safety_blocked", "Provider returned an empty response.");

    const u = res.usageMetadata;
    return {
      text,
      ...(typeof res.modelVersion === "string" ? { modelReported: res.modelVersion } : {}),
      usage: {
        ...(u?.promptTokenCount !== undefined ? { inputTokens: u.promptTokenCount } : {}),
        ...(u?.candidatesTokenCount !== undefined ? { outputTokens: u.candidatesTokenCount } : {}),
      },
      latencyMs: Date.now() - started,
    };
  }
}
