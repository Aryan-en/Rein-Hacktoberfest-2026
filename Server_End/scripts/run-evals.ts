/**
 * Evaluates the investigation pipeline on the synthetic dataset.
 *   npx tsx scripts/run-evals.ts --offline   # rules only, no network, no key (runs in CI)
 *   npx tsx scripts/run-evals.ts             # live: uses DO_GENAI_API_KEY and configured models
 * Dataset is SYNTHETIC. URLs in it are never fetched.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { investigate, type InvestigateInput } from "../src/analysis/pipeline";
import { createChatClient, DigitalOceanProvider } from "../src/ai/providers/digitalocean";
import { loadDotEnv, parseConfig } from "../src/config/env";

loadDotEnv();
const offline = process.argv.includes("--offline");
const config = parseConfig(offline ? { ...process.env, DO_GENAI_API_KEY: "" } : process.env);
const provider = !offline && config.apiKey ? new DigitalOceanProvider(createChatClient(config.apiKey, config.baseUrl)) : null;
if (!offline && !provider) {
  console.error("Live mode needs DO_GENAI_API_KEY. Use --offline for rules-only evaluation.");
  process.exit(2);
}

interface Row {
  id: string; kind: string; text?: string; url?: string;
  offlineRiskIn: string[]; riskIn: string[]; mustSignals?: string[]; mustNotSignals?: string[];
}
const rows: Row[] = readFileSync(new URL("../evals/datasets/synthetic.jsonl", import.meta.url), "utf8").trim().split("\n").map((l) => JSON.parse(l));

const results: any[] = [];
let failed = 0;
for (const row of rows) {
  const input: InvestigateInput = row.url ? { type: "url", url: row.url } : { type: "text", text: row.text! };
  const t0 = Date.now();
  const r = await investigate(input, {
    provider,
    config: { primaryModel: config.primaryModel, fallbackModel: config.fallbackModel, visionModels: [], maxTextChars: config.maxTextChars, modelTimeoutMs: config.modelTimeoutMs, jsonMode: config.jsonMode },
  });
  const ids = new Set(r.signals.map((s) => s.id));
  const allowed = offline ? row.offlineRiskIn : row.riskIn;
  const problems: string[] = [];
  if (!allowed.includes(r.classification.risk)) problems.push(`risk ${r.classification.risk} not in [${allowed}]`);
  for (const s of row.mustSignals ?? []) if (!ids.has(s)) problems.push(`missing signal ${s}`);
  for (const s of row.mustNotSignals ?? []) if (ids.has(s)) problems.push(`unexpected signal ${s}`);
  if (!offline && r.model.mode !== "ai_assisted") problems.push(`model degraded: ${r.model.degradedReason}`);
  const aiEv = r.evidence.filter((e) => e.provenance === "ai_interpretation");
  if (problems.length) failed++;
  results.push({
    id: row.id, kind: row.kind, risk: r.classification.risk, category: r.classification.category, mode: r.model.mode, usedModel: r.model.usedModel,
    aiEvidence: aiEv.length, aiEvidenceVerified: aiEv.filter((e) => e.quoteVerified).length, signals: [...ids], ms: Date.now() - t0, problems,
  });
  console.log(`${problems.length ? "FAIL" : "ok  "} ${row.id.padEnd(22)} ${r.classification.risk.padEnd(8)} ${r.model.mode.padEnd(18)} ${problems.join("; ")}`);
}
const summary = {
  date: new Date().toISOString(), mode: offline ? "offline-rules-only" : "live", models: offline ? null : [config.primaryModel, config.fallbackModel],
  total: rows.length, failed,
  byKind: Object.fromEntries([...new Set(rows.map((r) => r.kind))].map((k) => [k, { total: results.filter((x) => x.kind === k).length, failed: results.filter((x) => x.kind === k && x.problems.length).length }])),
};
console.log("\n" + JSON.stringify(summary, null, 2));
mkdirSync(new URL("../evals/results/", import.meta.url), { recursive: true });
writeFileSync(new URL(`../evals/results/${offline ? "offline" : "live"}-${new Date().toISOString().slice(0, 10)}.json`, import.meta.url), JSON.stringify({ summary, results }, null, 2));
process.exit(failed ? 1 : 0);
