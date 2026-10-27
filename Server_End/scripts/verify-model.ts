/**
 * Verifies the configured AI provider with YOUR key. Never prints the key.
 *   npm run verify-model
 * Probes each configured model through the same adapter the server uses: plain answer, JSON-ish output,
 * and (if a vision model is configured) a tiny image. Results are written to evals/results/.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createProvider } from "../src/ai/providers";
import { loadDotEnv, parseConfig } from "../src/config/env";
import { AiProviderError } from "../src/types/ai";

loadDotEnv();
const cfg = parseConfig();
const provider = createProvider(cfg);
if (!provider || !cfg.provider) {
  console.error("No real API key found. Set GEMINI_API_KEY (or DO_GENAI_API_KEY) in Server_End/.env. Placeholder values like 'dummy-…' are ignored. Nothing was verified.");
  process.exit(2);
}
const out: Record<string, unknown> = { date: new Date().toISOString(), provider: cfg.provider };
const row = (k: string, v: unknown) => { out[k] = v; console.log(k.padEnd(40), typeof v === "string" ? v : JSON.stringify(v)); };
console.log(`Provider: ${cfg.provider}`);

// 1x1 transparent PNG
const PNG_1PX = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64"));

async function probe(model: string, label: string, image = false) {
  const t0 = Date.now();
  try {
    const r = await provider!.generate(
      {
        model,
        systemInstruction: "You reply only with a JSON object.",
        userText: image ? 'Reply with {"ok":true,"saw_image":true}' : 'Reply with {"ok":true}',
        ...(image ? { image: { mimeType: "image/png" as const, data: PNG_1PX } } : {}),
        maxOutputTokens: 120,
        temperature: 0,
        jsonMode: cfg.jsonMode,
      },
      { signal: AbortSignal.timeout(45_000) },
    );
    let json = false; try { JSON.parse(r.text.replace(/^```json\s*|```$/g, "")); json = true; } catch { /* not JSON */ }
    row(`${label}:${model}`, { ok: true, ms: Date.now() - t0, parsesAsJson: json, modelReported: r.modelReported ?? null, sample: r.text.slice(0, 80) });
  } catch (e) {
    const kind = e instanceof AiProviderError ? e.kind : "unknown";
    row(`${label}:${model}`, { ok: false, kind, hint: kind === "auth" ? "key rejected" : kind === "bad_request" ? "model ID or feature not available to this key" : kind === "rate_limited" ? "quota/rate limit" : "see server logs" });
  }
}

for (const m of [cfg.primaryModel, cfg.fallbackModel].filter((m): m is string => !!m)) await probe(m, "text");
if (cfg.visionModel) await probe(cfg.visionModel, "vision(image input)", true);
else row("vision", "no vision model configured: screenshot mode disabled");

mkdirSync(new URL("../evals/results/", import.meta.url), { recursive: true });
writeFileSync(new URL(`../evals/results/verify-model-${cfg.provider}-${new Date().toISOString().slice(0, 10)}.json`, import.meta.url), JSON.stringify(out, null, 2));
