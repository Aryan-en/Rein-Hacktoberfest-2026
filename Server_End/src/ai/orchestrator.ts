import { AiProviderError, type AiProvider, type AiRequest, type ModelFindings } from "../types/ai";
import type { ModelAttempt, ModelDisclosure } from "../types/investigation";
import { TOTAL_MODEL_BUDGET_MS } from "../validation/limits";
import { buildRepairPrompt, parseModelOutput } from "./parse";

export interface InferenceInput {
  models: string[];
  systemInstruction: string;
  userText: string;
  image?: AiRequest["image"];
}

export interface InferenceDeps {
  provider: AiProvider | null;
  timeoutMs: number;
  jsonMode: boolean;
  budgetMs?: number;
  maxOutputTokens?: number;
  temperature?: number;
  /** Injectable for tests. */
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}

export interface InferenceResult {
  findings: ModelFindings | null;
  disclosure: ModelDisclosure;
  modelMs: number | null;
}

type CallResult = { ok: true; text: string; ms: number } | { ok: false; kind: AiProviderError["kind"]; ms: number };

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const kindToOutcome = (k: AiProviderError["kind"]): ModelAttempt["outcome"] =>
  k === "timeout" ? "timeout" : k === "rate_limited" ? "rate_limited" : k === "safety_blocked" ? "blocked" : "error";

/**
 * Fallback chain (Architecture §4.6–4.7): each configured model in order, then deterministic-only.
 * Never calls a model that was not configured, and always reports exactly what happened.
 */
export async function runInference(input: InferenceInput, deps: InferenceDeps): Promise<InferenceResult> {
  const now = deps.now ?? Date.now;
  const sleep = deps.sleep ?? defaultSleep;
  const budget = deps.budgetMs ?? TOTAL_MODEL_BUDGET_MS;
  const requestedModel = input.models[0] ?? "(none)";
  const attempts: ModelAttempt[] = [];
  const started = now();

  const degrade = (reason: string): InferenceResult => ({
    findings: null,
    disclosure: { mode: "deterministic_only", requestedModel, usedModel: null, attempts, fellBack: false, degradedReason: reason },
    modelMs: attempts.length ? now() - started : null,
  });

  if (!deps.provider) return degrade("AI analysis is not configured on this server (missing API key).");
  if (input.models.length === 0) return degrade("No model is configured for this input type.");
  const provider = deps.provider;

  const call = async (model: string, userText: string): Promise<CallResult> => {
    const t0 = now();
    const ctrl = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, rej) => {
      timer = setTimeout(() => {
        ctrl.abort();
        rej(new AiProviderError("timeout", "Model attempt timed out."));
      }, deps.timeoutMs);
    });
    try {
      const req: AiRequest = {
        model,
        systemInstruction: input.systemInstruction,
        userText,
        ...(input.image ? { image: input.image } : {}),
        maxOutputTokens: deps.maxOutputTokens ?? 2048,
        temperature: deps.temperature ?? 0.1,
        jsonMode: deps.jsonMode,
      };
      const res = await Promise.race([provider.generate(req, { signal: ctrl.signal }), timeout]);
      return { ok: true, text: res.text, ms: now() - t0 };
    } catch (e) {
      const kind = e instanceof AiProviderError ? e.kind : "network";
      return { ok: false, kind, ms: now() - t0 };
    } finally {
      if (timer) clearTimeout(timer);
    }
  };

  let authFailed = false;
  for (const model of input.models) {
    if (now() - started >= budget) break;
    let retried = false;
    for (;;) {
      const r = await call(model, input.userText);
      if (!r.ok) {
        attempts.push({ model, outcome: kindToOutcome(r.kind), latencyMs: r.ms });
        if (r.kind === "auth") {
          authFailed = true;
          break;
        }
        if ((r.kind === "server" || r.kind === "network") && !retried && now() - started < budget) {
          retried = true;
          await sleep(500 + Math.floor(Math.random() * 250));
          continue;
        }
        break; // next model
      }

      let parsed = parseModelOutput(r.text);
      if (parsed.ok) {
        attempts.push({ model, outcome: "ok", latencyMs: r.ms });
        return success(parsed.data, model);
      }
      attempts.push({ model, outcome: "invalid_output", latencyMs: r.ms });
      if (now() - started >= budget) break;
      // One repair retry on the same model.
      const rr = await call(model, `${input.userText}\n\n${buildRepairPrompt(r.text, parsed.reason)}`);
      if (rr.ok) {
        parsed = parseModelOutput(rr.text);
        if (parsed.ok) {
          attempts.push({ model, outcome: "ok", latencyMs: rr.ms });
          return success(parsed.data, model);
        }
        attempts.push({ model, outcome: "invalid_output", latencyMs: rr.ms });
      } else {
        attempts.push({ model, outcome: kindToOutcome(rr.kind), latencyMs: rr.ms });
        if (rr.kind === "auth") authFailed = true;
      }
      break;
    }
    if (authFailed) break;
  }

  if (authFailed) return degrade("The AI provider rejected the server's credentials.");
  return degrade("AI analysis was unavailable (all configured models timed out, were rate-limited, or returned unusable output).");

  function success(findings: ModelFindings, model: string): InferenceResult {
    return {
      findings,
      disclosure: { mode: "ai_assisted", requestedModel, usedModel: model, attempts, fellBack: model !== requestedModel },
      modelMs: now() - started,
    };
  }
}
