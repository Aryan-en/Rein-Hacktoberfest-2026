# TrustLens AI: Server_End (backend)

Evidence-based scam & phishing investigation API. A deterministic security engine runs first; an open-weight model on **DigitalOcean GenAI** adds contextual, bilingual (English/Hindi) interpretation; every model claim is **verified against the input** before it can influence the risk label.

> **Status (honest):** implemented and tested locally with a fake model provider (194 tests) and a rules-only evaluation (30/30). **No live DigitalOcean GenAI call has been made yet**: it needs `DO_GENAI_API_KEY`. Default model IDs and the vision path are unverified until you run `npm run verify-model`. See `../context/Progress-tracker.md`.

## Quick start

```bash
cd Server_End
npm install
cp .env.example .env        # add DO_GENAI_API_KEY (never commit it)
npm run verify-model        # checks the endpoint, model IDs, JSON mode, vision (needs the key)
npm run dev                 # http://localhost:8080
```

Without a key the server still runs in **`deterministic_only`** mode (rules engine only, clearly labelled in every report).

```bash
curl -s localhost:8080/api/health
curl -s -X POST localhost:8080/api/analyze -H 'content-type: application/json' \
  -d '{"inputType":"text","text":"SBI KYC expired! Update within 24 hrs: http://sbi-kyc-verify.top/login. Share OTP."}'
```

## API

| Endpoint | Description |
|---|---|
| `GET /api/health` | `{status, version, ai: "configured"\|"missing_key", models, screenshot}`. Never calls the model. |
| `POST /api/analyze` | Body: `{"inputType":"text","text":…}` · `{"inputType":"url","url":…}` · `{"inputType":"image","image":{"mimeType":"image/png\|jpeg\|webp","dataBase64":…},"note"?:…}`. Returns an `InvestigationReport` (contract: `../context/Architecture.md` §7, deviations §13). |

Status codes: `200` report (also when degraded) · `400 invalid_request` · `413 payload_too_large` · `415 unsupported_media_type` · `429 rate_limited` (+`Retry-After`) · `503 image_analysis_unavailable` · `500 internal_error`. Every response carries `X-Request-Id`.

## How a request is processed

`rate limit → content-type/size checks → Zod validation → (image: size + magic-byte check) → normalize → URL & text heuristics → fenced prompt → model (primary → fallback → deterministic-only) → JSON parse/validate (+1 repair) → quote verification → risk classification → report`.

- **Risk** is ordinal (`low|medium|high|unknown`) with a rationale; there are no probabilities. AI can't lower risk below the rule-based floor and can't reach High without a quote that exists in the input. Low never means "safe". With no AI and no signals the result is `unknown`.
- **Transparency:** `model` in every report lists requested/used model, every attempt, and whether it fell back or degraded.
- **Safety:** submitted URLs are **never fetched or resolved**; content is fenced with a per-request nonce and treated as data; model output is schema-validated and never rendered as HTML; logs contain no user content (allow-listed fields only).

## Configuration

All variables are documented in `.env.example`. Key ones: `DO_GENAI_API_KEY`, `DO_GENAI_BASE_URL` (default `https://inference.do-ai.run/v1`), `TRUSTLENS_PRIMARY_MODEL`, `TRUSTLENS_FALLBACK_MODEL`, `TRUSTLENS_VISION_MODEL` (enables screenshot mode), `TRUSTLENS_CORS_ORIGINS`, `TRUSTLENS_PROXY_HOPS`.

## Scripts

| Command | Purpose |
|---|---|
| `npm run typecheck` / `npm test` / `npm run check` | `tsc --noEmit` / Vitest (offline, deterministic) / both |
| `npm run eval:offline` | Rules-only evaluation on `evals/datasets/synthetic.jsonl` (no network) |
| `npm run eval:live` | Same dataset through the real model (needs key); writes `evals/results/` |
| `npm run verify-model` | Live endpoint, model ID, JSON-mode and vision verification |
| `npm start` | Run the server |

## Layout

```
src/app.ts server.ts      HTTP handler (CORS, limits, error mapping) and entry point
src/config/               typed env parsing
src/types/ validation/    shared contracts, request schema, limits
src/security/             normalize, URL parse/heuristics, text signals, rate limit, image validation
src/ai/                   prompts, output schema, parse/repair, orchestrator, DigitalOcean provider
src/analysis/             evidence verification, classification, recommendations, pipeline
tests/ scripts/ evals/    unit + HTTP integration tests, verify/eval scripts, synthetic dataset
.do/app.yaml              DigitalOcean App Platform spec (unvalidated)
```

## Limitations

Heuristics are patterns, not proof; brand coverage is a small curated list; Hindi/Hinglish detection is lexicon-based; the in-memory rate limiter is per-instance; submitted content is sent to the model provider (verify its retention terms before launch).
