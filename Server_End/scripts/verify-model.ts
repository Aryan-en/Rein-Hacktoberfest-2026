/**
 * T0-01: verifies the DigitalOcean GenAI endpoint with YOUR key. Never prints the key.
 *   DO_GENAI_API_KEY=... npx tsx scripts/verify-model.ts
 * Checks: GET /models, each configured model answers, system-instruction + JSON mode behaviour,
 * and (if TRUSTLENS_VISION_MODEL is set) image input. Results are written to evals/results/.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import OpenAI from "openai";
import { loadDotEnv, parseConfig } from "../src/config/env";

loadDotEnv();
const cfg = parseConfig();
if (!cfg.apiKey) {
  console.error("DO_GENAI_API_KEY is not set (put it in Server_End/.env or the environment). Nothing was verified.");
  process.exit(2);
}
const client = new OpenAI({ apiKey: cfg.apiKey, baseURL: cfg.baseUrl, maxRetries: 0, timeout: 40_000 });
const out: Record<string, unknown> = { date: new Date().toISOString(), baseUrl: cfg.baseUrl };
const row = (k: string, v: unknown) => { out[k] = v; console.log(k.padEnd(34), typeof v === "string" ? v : JSON.stringify(v)); };

// 1x1 transparent PNG
const PNG_1PX = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==";

let available: string[] = [];
try {
  const list = await client.models.list();
  available = list.data.map((m) => m.id);
  row("models.list", `${available.length} models`);
  console.log("  available:", available.join(", "));
} catch (e) {
  row("models.list", `FAILED (${(e as { status?: number }).status ?? "network"}): ${(e as Error).message.slice(0, 160)}`);
}

async function probe(model: string, label: string, image = false) {
  const started = Date.now();
  try {
    const res = await client.chat.completions.create({
      model,
      max_tokens: 80,
      temperature: 0,
      messages: [
        { role: "system", content: "You reply only with a JSON object." },
        { role: "user", content: image
          ? [{ type: "text", text: 'Reply with {"ok":true,"saw_image":true}' }, { type: "image_url", image_url: { url: `data:image/png;base64,${PNG_1PX}` } }]
          : 'Reply with {"ok":true}' },
      ],
      response_format: { type: "json_object" },
    } as never);
    const text = res.choices[0]?.message?.content ?? "";
    let json = false; try { JSON.parse(text); json = true; } catch { /* not JSON */ }
    row(`${label}:${model}`, { ok: true, ms: Date.now() - started, jsonModeValidJson: json, sample: text.slice(0, 80) });
  } catch (e) {
    const err = e as { status?: number; message?: string };
    row(`${label}:${model}`, { ok: false, status: err.status ?? "network", error: String(err.message).slice(0, 200) });
  }
}

for (const m of [cfg.primaryModel, cfg.fallbackModel].filter((m): m is string => !!m)) {
  if (available.length && !available.includes(m)) console.warn(`  WARNING: ${m} is not in /models. Set TRUSTLENS_*_MODEL to an ID listed above.`);
  await probe(m, "text");
}
if (cfg.visionModel) await probe(cfg.visionModel, "vision", true);
else row("vision", "TRUSTLENS_VISION_MODEL not set: screenshot mode will be disabled");

mkdirSync(new URL("../evals/results/", import.meta.url), { recursive: true });
writeFileSync(new URL(`../evals/results/verify-model-${new Date().toISOString().slice(0, 10)}.json`, import.meta.url), JSON.stringify(out, null, 2));
