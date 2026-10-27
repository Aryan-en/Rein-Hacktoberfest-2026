import OpenAI from "openai";
import { AiProviderError, type AiProvider, type AiRawResponse, type AiRequest } from "../../types/ai";

/** Minimal surface of the OpenAI client that we use; lets tests inject a fake. */
export interface ChatClient {
  chat: { completions: { create(params: any, opts?: { signal?: AbortSignal }): Promise<any> } };
}

export function createChatClient(apiKey: string, baseURL: string): ChatClient {
  // maxRetries: 0, because retries and fallbacks are the orchestrator's job (Architecture §4.6).
  return new OpenAI({ apiKey, baseURL, maxRetries: 0 }) as unknown as ChatClient;
}

function mapError(e: unknown): AiProviderError {
  if (e instanceof AiProviderError) return e;
  const err = e as { name?: string; status?: number; message?: string };
  if (err?.name === "AbortError" || err?.name === "APIUserAbortError" || err?.name === "APIConnectionTimeoutError") {
    return new AiProviderError("timeout", "Model request timed out or was aborted.");
  }
  const status = err?.status;
  if (status === 401 || status === 403) return new AiProviderError("auth", "Provider rejected the credentials.");
  if (status === 429) return new AiProviderError("rate_limited", "Provider rate limit or quota reached.");
  if (status === 400 || status === 404 || status === 422) return new AiProviderError("bad_request", `Provider rejected the request (${status}).`);
  if (typeof status === "number" && status >= 500) return new AiProviderError("server", `Provider error (${status}).`);
  return new AiProviderError("network", "Could not reach the model provider.");
}

export class DigitalOceanProvider implements AiProvider {
  readonly id = "digitalocean-genai";
  constructor(private client: ChatClient) {}

  async generate(req: AiRequest, opts: { signal: AbortSignal }): Promise<AiRawResponse> {
    const started = Date.now();
    const userContent: unknown = req.image
      ? [
          { type: "text", text: req.userText },
          { type: "image_url", image_url: { url: `data:${req.image.mimeType};base64,${Buffer.from(req.image.data).toString("base64")}` } },
        ]
      : req.userText;
    const base = {
      model: req.model,
      temperature: req.temperature,
      max_tokens: req.maxOutputTokens,
      messages: [
        { role: "system", content: req.systemInstruction },
        { role: "user", content: userContent },
      ],
    };

    const call = (withJson: boolean) =>
      this.client.chat.completions.create(
        withJson ? { ...base, response_format: { type: "json_object" } } : base,
        { signal: opts.signal },
      );

    let res: any;
    try {
      try {
        res = await call(req.jsonMode);
      } catch (e) {
        // Some models/endpoints reject response_format. Retry once without it.
        const st = (e as { status?: number }).status;
        const msg = String((e as { message?: string }).message ?? "");
        if (req.jsonMode && st === 400 && /response_format|json/i.test(msg)) res = await call(false);
        else throw e;
      }
    } catch (e) {
      throw mapError(e);
    }

    const choice = res?.choices?.[0];
    if (choice?.finish_reason === "content_filter") throw new AiProviderError("safety_blocked", "Response blocked by provider safety filter.");
    const text: unknown = choice?.message?.content;
    if (typeof text !== "string" || text.trim() === "") throw new AiProviderError("safety_blocked", "Provider returned an empty response.");

    return {
      text,
      ...(typeof res.model === "string" ? { modelReported: res.model } : {}),
      usage: {
        ...(res.usage?.prompt_tokens !== undefined ? { inputTokens: res.usage.prompt_tokens } : {}),
        ...(res.usage?.completion_tokens !== undefined ? { outputTokens: res.usage.completion_tokens } : {}),
      },
      latencyMs: Date.now() - started,
    };
  }
}
