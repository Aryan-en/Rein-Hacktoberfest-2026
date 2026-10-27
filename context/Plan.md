# TrustLens AI — Implementation Plan

> **Owner:** Claude (scope/time changes), executed by Claude / Codex / Gemini. State lives in `Progress-tracker.md`; this file defines *what* and *when*.
> **Hard deadline:** **2026-10-27 16:30 IST**. Planning started ~**10:45 IST** (machine clock at 10:36 IST when docs began). **≈ 5h45m of total time.** Re-check `date` at the start of every work session and adjust.
> **Principle:** Protect a working, deployed, demoable MVP. P0 before P1 before P2. Deploy early.

---

## 1. Time Budget (IST, wall-clock)

| Window | Phase | Goal | Gate to leave phase |
|---|---|---|---|
| 10:45–11:30 | **0 Foundation** | Key verified, repo scaffolded, contracts frozen | `npm run build` passes; T0-01 evidence recorded |
| 11:15–12:30 | **1 Core AI** (parallel w/ 2, 3) | Real DigitalOcean Open-Weight AI inference returning validated JSON | One real text analysis returns schema-valid findings |
| 11:30–13:15 | **2 Investigation engine** | Deterministic engine + risk + `/api/analyze` | Curl text & URL returns full report |
| 11:45–14:00 | **3 Frontend** | Landing + workspace + results wired to API | Full text/URL journey works in browser |
| 13:00–13:30 | **6a Early deploy** | Skeleton live on DigitalOcean | Live `/api/health` 200 |
| 13:15–14:30 | **4 Multimodal** | Screenshot analysis | Image journey works locally |
| **14:45** | **FEATURE FREEZE** | No new features after this | — |
| 14:00–15:15 | **5 Quality** | Tests, a11y, security review | `typecheck && lint && test && build` green |
| 14:45–15:30 | **6b Final deploy** | Full app live with secrets, smoke tested | Live smoke script passes |
| 14:30–15:45 | **7 Presentation** | Demo scenarios, README, screenshots, script, backup | Demo rehearsed once end-to-end |
| 15:45–16:00 | Submission prep | Fill event form; verify links open logged-out | — |
| **16:00** | **SUBMIT** | Submit with 30 min buffer | — |
| 16:00–16:30 | Buffer | Only fix submission problems | — |

If the actual start is later than 10:45, shift windows but **keep 14:45 freeze and 16:00 submit fixed**; drop scope per §6.

**Human-required actions** (agents cannot do these; blocking if not done): (H1) supply `DO_GENAI_API_KEY` (and `DO_GENAI_BASE_URL` if custom) as local env vars (never commit); (H2) create/authorize DigitalOcean App and connect GitHub; (H3) confirm hackathon submission form fields; (H4) record backup demo video.

---

## 2. Critical Path

```
T0-02 scaffold ─► T0-04 types/schemas ─► T1-01 adapter ─► T1-04 orchestrator ─► T2-08 pipeline ─► T2-10 API route ─► T3-06 client wiring ─► T6-03 final deploy ─► T7-06 submit
        │                  │                                        ▲                                    ▲
        │                  └► T2-05 classify, T2-06 verify ─────────┘                                    │
        └► T0-01 verify model (needs H1) ─► T1-02 prompts ─► T1-05 real inference ───────────────────────┘
```
Parallelizable off-path: T2-01..04 (security engine), T3-01..05 (static UI against fixture report), T7-xx content, tests.

---

## 3. Task Table

**Legend** — Priority: P0 must ship; P1 should ship; P2 only if ahead. Agent: C=Claude, X=Codex, G=Gemini. Status values: TODO / IN_PROGRESS / BLOCKED / REVIEW / DONE (live status is in `Progress-tracker.md`; the column below shows the *initial* value only). "Est" = focused agent-time, not wall-clock. Paths are relative to repo root.

### Phase 0 — Foundation

| ID | Task | Pri | Agent | Deps | Expected files | Acceptance criteria | Verification | Est | Status |
|---|---|---|---|---|---|---|---|---|---|
| T0-01 | Verify DigitalOcean GenAI endpoint & credentials | P0 | G | H1 | `scripts/verify-model.ts`, tracker §F entry | Script calls DigitalOcean GenAI open-weight models (`meta-llama/llama-3.3-70b-instruct` primary, `meta-llama/llama-3.1-8b-instruct` fallback) with a trivial prompt, prints model ID, success/failure, latency; separately tests (a) system instruction, (b) JSON response formatting; (c) records any 4xx quota/rate-limit text. Results logged in tracker §F; Architecture §0 updated. Key read from env only. | `npx tsx scripts/verify-model.ts` | 25m | TODO |
| T0-02 | Scaffold Next.js app & dependencies | P0 | X | — | `package.json`, `tsconfig.json`, `next.config.ts`, tailwind/postcss config, `components.json`, `vitest.config.ts`, eslint config, `src/app/*` skeleton, `.gitignore` | App Router + TS `strict: true`; Tailwind + shadcn initialized; deps installed and pinned in lockfile: `zod`, `openai`, `tldts`, `lucide-react`, `motion`, `server-only`, dev: `vitest`, `tsx`, `@types/*`; npm scripts: `dev`, `build`, `start`, `typecheck`, `lint`, `test`, `test:ai`. `.env*` gitignored (except `.env.example`). Docs in `context/` untouched. | `npm run typecheck && npm run lint && npm run build` | 25m | TODO |
| T0-03 | Env config module + `.env.example` | P0 | X | T0-02 | `src/lib/config/env.ts`, `.env.example` | Zod-parsed typed config with defaults from Architecture §9.3; `DO_GENAI_API_KEY` optional at parse time (absence → `aiConfigured=false`), server-only import guard; `.env.example` lists all names with no secret values. | `npm run typecheck && npx vitest run tests/unit/config` | 10m | TODO |
| T0-04 | Freeze shared types, limits & Zod schemas | P0 | C | T0-02 | `src/types/investigation.ts`, `src/types/ai.ts`, `src/lib/validation/{request,response,limits}.ts` | Types exactly match Architecture §4.1, §4.5, §7; `AnalyzeRequestSchema` enforces limits and discriminated union; `InvestigationReportSchema` exists for response self-check in tests; exports consumed without circular imports. Committed to `main` so all agents branch from it. | `npm run typecheck && npx vitest run tests/unit/validation` | 30m | TODO |
| T0-05 | Verify deployment & SDK assumptions against current docs | P0 | C | — | edits to `Architecture.md` §0/§9 | DO App Platform: Node buildpack version support, port variable, health-check config, env secret type, rollback method — each marked verified (with source URL) or still-assumed. OpenAI client configuration with DigitalOcean GenAI endpoint (`https://inference.do.co/v1`) confirmed. | Manual review of edited sections | 20m | TODO |
| T0-06 | Commit documentation baseline & push | P0 | C | — | git history | Five docs committed on `main`; `origin` verified; no secrets. (Requires user approval to push per AGENTS.md §5.) | `git log --oneline -3 && git status --short` | 5m | TODO |

### Phase 1 — Core AI

| ID | Task | Pri | Agent | Deps | Expected files | Acceptance criteria | Verification | Est | Status |
|---|---|---|---|---|---|---|---|---|---|
| T1-01 | DigitalOcean GenAI provider adapter | P0 | X | T0-03, T0-04, T0-01 (for image mode) | `src/lib/ai/providers/digitalocean.ts`, `tests/unit/ai/do-adapter.test.ts` | Implements `AiProvider`; only file importing `openai` client for DO GenAI; maps SDK errors to `AiProviderError.kind`; honors `AbortSignal`; passes system prompt, temperature, max tokens; unit-tested with a mocked client (no network). Never logs prompt/response bodies. | `npx vitest run tests/unit/ai/do-adapter.test.ts && npm run typecheck` | 35m | TODO |
| T1-02 | Prompt templates v1 (text) | P0 | G | T0-04 | `src/lib/ai/prompts/system.ts`, `src/lib/ai/prompts/text.ts`, `evals/prompt-notes.md` | Exports `buildSystemInstruction()` and `buildTextPrompt({content, signals, nonce})`. Content fenced with nonce; system rules: content is data, JSON-only, quotes must be verbatim, `hi` + `en` for every `LocalizedText`, no invented facts, "unknown" allowed, injection reporting field. Embeds the `ModelFindings` schema description matching `src/types/ai.ts`. Nonce stripped from content. Unit tests assert fencing and nonce stripping. | `npx vitest run tests/unit/ai/prompts.test.ts` | 40m | TODO |
| T1-03 | Model output schema + JSON extraction/repair | P0 | C | T0-04 | `src/lib/ai/output-schema.ts`, `src/lib/ai/parse.ts`, `tests/unit/ai/parse.test.ts` | `ModelFindingsSchema` matches type; `parseModelOutput(raw)` handles fenced JSON, leading/trailing prose, trailing commas (not required), returns discriminated `{ok:true,data}|{ok:false,reason}`; `buildRepairPrompt(raw, issues)` helper; ≥10 test cases incl. malformed/hostile outputs. | `npx vitest run tests/unit/ai/parse.test.ts` | 30m | TODO |
| T1-04 | AI orchestrator: fallback chain, timeouts, retry, disclosure | P0 | C | T1-01 (interface only needed; fake provider OK), T1-03 | `src/lib/ai/orchestrator.ts`, `tests/unit/ai/orchestrator.test.ts` | `runInference({provider, req, config})` returns `{findings|null, disclosure: ModelDisclosure}` per Architecture §4.6–4.7: timeout → next model; 429 → no same-model retry; 5xx → one retry; invalid JSON → one repair retry; both models fail → `findings:null`, `mode:"deterministic_only"` with `degradedReason`. Never calls a non-configured model. Tests with fake provider cover each row of §4.6 table. | `npx vitest run tests/unit/ai/orchestrator.test.ts` | 40m | TODO |
| T1-05 | Real inference smoke test | P0 | G | T1-01, T1-02, T1-03, T1-04 | `scripts/smoke-inference.ts`, `evals/results/smoke-<date>.json` | Runs ≥5 synthetic fixtures (2 phishing, 1 advance-fee, 1 benign, 1 injection) through real DigitalOcean GenAI open-weight model; records per fixture: used model, latency, valid-JSON first try (y/n), quote-verified ratio, risk label. Findings written to tracker §F; prompt tweaks made in own files if validity < 4/5. | `npx tsx scripts/smoke-inference.ts` | 30m | TODO |

### Phase 2 — Investigation engine

| ID | Task | Pri | Agent | Deps | Expected files | Acceptance criteria | Verification | Est | Status |
|---|---|---|---|---|---|---|---|---|---|
| T2-01 | Input normalization | P0 | X | T0-04 | `src/lib/security/normalize.ts`, `tests/unit/security/normalize.test.ts` | NFKC; strips zero-width & bidi controls and reports `hiddenCharactersRemoved`; control chars replaced; index map from normalized→original offsets; idempotent; ≥8 tests. | `npx vitest run tests/unit/security/normalize.test.ts` | 25m | TODO |
| T2-02 | URL extraction & parsing | P0 | X | T0-04 | `src/lib/security/url/{extract,parse}.ts`, `tests/unit/security/url-parse.test.ts` | Extracts ≤5 URLs (incl. scheme-less, `hxxp`-defanged input); WHATWG `URL` + `tldts` give hostname, registrable domain, subdomain, public suffix, isIp, port, userinfo; unparseable → structured observation; **zero network calls** (test spies on `fetch`/`dns`); fixtures: IPv4 decimal/hex, IPv6, `xn--`, `a.b.c.evil.xyz`, trailing-dot hosts. | `npx vitest run tests/unit/security/url-parse.test.ts` | 40m | TODO |
| T2-03 | URL heuristics | P0 | X | T2-02 | `src/lib/security/url/heuristics.ts`, `src/lib/security/data/{brands,shorteners,suspicious-tlds}.ts`, `tests/unit/security/url-heuristics.test.ts` | Implements every `url_*` signal in Architecture §5.4 with `Signal` shape and bilingual templates; brand table ≥25 entries (India-focused + global) with official registrable domains; at least one positive and one benign test per signal (e.g., `sbi.co.in` and `onlinesbi.sbi` must NOT fire brand mismatch; `paypal.com.secure-login.xyz` must fire `url_deceptive_subdomain`). | `npx vitest run tests/unit/security/url-heuristics.test.ts` | 60m | TODO |
| T2-04 | Text signal detectors | P0 | X | T2-01 | `src/lib/security/text/{signals,lexicon}.ts`, `tests/unit/security/text-signals.test.ts` | Implements all `text_*`, `hidden_characters`, `prompt_injection_attempt` signals; EN + Hindi (Devanagari) + Hinglish lexicons; windowed credential-request logic with negation guard ("never share your OTP" → no `text_credential_request`); returns spans; ≥2 benign negatives per strong signal. Lexicon coverage reviewed by G (see T5-03). | `npx vitest run tests/unit/security/text-signals.test.ts` | 50m | TODO |
| T2-05 | Risk classification | P0 | C | T0-04 | `src/lib/analysis/classify.ts`, `tests/unit/analysis/classify.test.ts` | Implements Architecture §6.2 exactly as pure function; exhaustive truth-table tests covering: every floor branch, AI high w/ and w/o verified quote, AI low vs floor (model_disagreement), insufficient input, deterministic_only with/without signals → unknown; no numeric score anywhere. | `npx vitest run tests/unit/analysis/classify.test.ts` | 35m | TODO |
| T2-06 | Evidence verification | P0 | C | T0-04, T2-01 | `src/lib/analysis/verify-evidence.ts`, `tests/unit/analysis/verify-evidence.test.ts` | Given normalized source text + `ModelFindings.evidence`, sets `quoteVerified` via whitespace/case-insensitive-normalized substring match and computes `span` into display text; unverified items retained but flagged; duplicate/overlapping evidence deduped; merges deterministic signals into `EvidenceItem[]` with provenance. Fabricated-quote test passes. | `npx vitest run tests/unit/analysis/verify-evidence.test.ts` | 35m | TODO |
| T2-07 | Bilingual recommendations | P0 | C | T0-04 | `src/lib/analysis/recommendations.ts`, `tests/unit/analysis/recommendations.test.ts` | Deterministic map (risk × category × signals) → recommendations EN+HI; includes "don't click/reply", "don't share OTP/PIN", "verify via official app/number", "report" (reporting channels re-verified from an official source and cited in a code comment), "contact bank if money sent". Every risk level returns ≥1 item. | `npx vitest run tests/unit/analysis/recommendations.test.ts` | 30m | TODO |
| T2-08 | Pipeline orchestration & report assembly | P0 | C | T1-04, T2-03, T2-04, T2-05, T2-06, T2-07 | `src/lib/analysis/{pipeline,report}.ts`, `tests/unit/analysis/pipeline.test.ts` | `investigate(req, deps)` runs stages in Architecture §2 order with injected `AiProvider`; output validates against `InvestigationReportSchema`; standing limitations always present; `deterministic_only` path produces valid report; never throws for model failures; timings recorded. | `npx vitest run tests/unit/analysis/pipeline.test.ts` | 45m | TODO |
| T2-09 | Rate limiter & daily cap | P0 | X | T0-03 | `src/lib/security/rate-limit.ts`, `tests/unit/security/rate-limit.test.ts` | In-memory token bucket per client key (default 10/min) + global daily cap; client key from trusted proxy header logic documented; returns `{allowed, retryAfterSeconds}`; injectable clock for tests; bounded memory (evicts stale keys). | `npx vitest run tests/unit/security/rate-limit.test.ts` | 25m | TODO |
| T2-10 | `POST /api/analyze` and `GET /api/health` | P0 | X | T0-04, T2-01, T2-08, T2-09 | `src/app/api/analyze/route.ts`, `src/app/api/health/route.ts`, `src/lib/security/image-validate.ts` (stub until T4-01) | Contract per Architecture §7: content-type check, streaming body-size cap, Zod validation, rate-limit, calls `investigate()`, maps errors to `ApiError` codes/status; `X-Request-Id` header; no body logging; `export const runtime = "nodejs"`; health returns `{status, version, ai}` w/o calling DO GenAI. Works end-to-end with real provider and with fake provider injected via a test-only seam (not an env flag in prod). | `curl -s -X POST localhost:3000/api/analyze -H 'content-type: application/json' -d '{"inputType":"text","text":"..."}'` and `npx vitest run tests/integration/api` | 45m | TODO |
| T2-11 | Integration tests: API | P0 | X | T2-10 | `tests/integration/api/analyze.test.ts` | Tests: 200 text/url; 400 invalid; 413 oversized text; 415 wrong content-type; 429 after N calls; deterministic_only when provider throws; response parses against `InvestigationReportSchema`; no network (fake provider); no content in captured logs. | `npx vitest run tests/integration/api` | 35m | TODO |

### Phase 3 — Frontend (all Codex; contracts in `UI-registery.md`)

| ID | Task | Pri | Agent | Deps | Expected files | Acceptance criteria | Verification | Est | Status |
|---|---|---|---|---|---|---|---|---|---|
| T3-01 | Design system foundation | P0 | X | T0-02 | `src/app/globals.css`, Tailwind theme, `src/app/layout.tsx` (fonts), `src/components/ui/*` (button, tabs, textarea, input, sheet, dropdown-menu, tooltip, sonner/toast), `src/lib/utils` | Tokens from UI-registery §A as CSS variables + Tailwind theme; fonts via `next/font`; dark-only; `:focus-visible` ring; reduced-motion handling; print stylesheet stub. | `npm run build` + visual check in browser | 40m | TODO |
| T3-02 | Fixture report for UI development | P0 | X | T0-04 | `src/lib/demo/sample-report.ts` | One schema-valid `InvestigationReport` (clearly synthetic, used on landing sample card + for UI dev + tests) per type; validated by `InvestigationReportSchema` in a test. | `npx vitest run tests/unit/demo` | 15m | TODO |
| T3-03 | Layout components | P0 | X | T3-01 | `components/layout/{AppShell,TopNavigation,Footer}.tsx` | Per UI-registery C.1; skip link; landmarks; mobile sheet menu; no non-functional links. | `npm run build` + keyboard tab-through | 30m | TODO |
| T3-04 | Landing page | P0 | X | T3-03, T3-02 | `src/app/page.tsx`, `components/landing/HeroSection.tsx` | Per B.1; sample card labelled "Sample report (synthetic example)"; CTAs route correctly; no fake stats. | Browser check at 375px & 1280px | 40m | TODO |
| T3-05 | Workspace input components | P0 | X | T3-01 | `components/investigate/{InvestigationInput,InputModeTabs,MessageInput,URLInput,AnalyzeButton,DemoScenarioSelector,EmptyState}.tsx` | Per C.3; client validation uses `limits.ts`; counter real; Ctrl/Cmd+Enter; demo selector fills inputs from `lib/demo/scenarios.ts` (G delivers T7-01; temporary 2 placeholders flagged `// TEMP` allowed until then). | `npm run typecheck && npm run build` | 50m | TODO |
| T3-06 | API client & `useInvestigation` | P0 | X | T0-04 | `src/lib/api-client.ts`, `src/hooks/{useInvestigation,useReportLanguage}.ts`, `tests/unit/hooks` | Per C.6; abort on reset; typed errors; 429 cooldown; unit tests with mocked `fetch`. | `npx vitest run tests/unit/hooks` | 35m | TODO |
| T3-07 | Report components | P0 | X | T3-01, T3-02 | `components/report/{RiskClassification,ThreatCategoryBadge,ModelDisclosureBar,AIExplanationPanel,HighlightedMessage,EvidenceCard,SafetyRecommendations,UncertaintyNotice}.tsx`, `components/common/LanguageSwitcher.tsx`, `lib/report/spans.ts`, `tests/unit/report/spans.test.ts` | Per C.5 using sample report in all 4 risk variants; no color-only signaling; Hindi `lang` attrs; span algorithm handles overlaps & unicode (tests). | `npx vitest run tests/unit/report && npm run build` | 75m | TODO |
| T3-08 | URL forensics panel | P0 | X | T3-07 | `components/report/URLForensicsPanel.tsx` (+ sub-parts) | Per B.4/C.5: defanged display, host breakdown, facts, signals; no anchors to analyzed URLs (test asserts no `<a>` to submitted URL). | `npx vitest run tests/unit/report` | 40m | TODO |
| T3-09 | Progress, errors, boundary | P0 | X | T3-06 | `components/investigate/{InvestigationProgress,ErrorPanel}.tsx`, `components/common/ErrorBoundary.tsx`, `src/app/{error,not-found}.tsx` | Per B.7; elapsed timer real; countdown for 429; boundary catches a thrown child in test. | `npx vitest run tests/unit/ui` | 30m | TODO |
| T3-10 | Investigate page integration | P0 | X | T3-05, T3-06, T3-07, T3-08, T3-09, T2-10 | `src/app/investigate/page.tsx` + client container | Full text & URL journeys against live local API; `?demo=` & `?mode=`; focus management on completion; evidence ↔ highlight linking; language switch. | Manual: run journeys D.1, D.2, D.4, D.5; record in tracker §F | 45m | TODO |
| T3-11 | Report export | P1 | X | T3-10 | `components/report/ExportReportButton.tsx`, `src/lib/report/{json,markdown}.ts`, print CSS, `tests/unit/report/export.test.ts` | JSON, Markdown, print, copy summary; includes disclosure + limitations; no image bytes; filename format per B.6. | `npx vitest run tests/unit/report/export.test.ts` + manual print preview | 40m | TODO |

### Phase 4 — Multimodal

| ID | Task | Pri | Agent | Deps | Expected files | Acceptance criteria | Verification | Est | Status |
|---|---|---|---|---|---|---|---|---|---|
| T4-01 | Server image validation | P1 | X | T2-10 | `src/lib/security/image-validate.ts`, `tests/unit/security/image-validate.test.ts` | Magic-byte check for PNG/JPEG/WebP; decoded size ≤ limit; base64 validity; MIME mismatch → 415; SVG/GIF/PDF/HTML-disguised rejected; tests with crafted byte arrays. | `npx vitest run tests/unit/security/image-validate.test.ts` | 25m | TODO |
| T4-02 | Image prompt + OCR output contract | P1 | G | T1-02, T0-01 | `src/lib/ai/prompts/image.ts`, `evals/prompt-notes.md` | `buildImagePrompt()` adds `extractedText` instruction and OCR-uncertainty guidance; same fencing rules; test asserts schema text includes `extractedText`. | `npx vitest run tests/unit/ai/prompts.test.ts` | 25m | TODO |
| T4-03 | Pipeline: screenshot path | P1 | C | T4-01, T4-02, T2-08 | edits in `src/lib/analysis/pipeline.ts`, `tests/unit/analysis/pipeline-image.test.ts` | Image request → model with image → `extractedText` re-run through text/URL heuristics with `source:"ocr"`; empty OCR → Unknown risk; verification against OCR text; report states OCR caveat. Tested with fake provider. | `npx vitest run tests/unit/analysis/pipeline-image.test.ts` | 35m | TODO |
| T4-04 | ScreenshotUploader + image mode wiring | P1 | X | T3-05, T4-03 | `components/investigate/ScreenshotUploader.tsx`, edits to InvestigationInput, `api-client` (base64 encode) | Per C.3; drag/drop/click/paste; preview; revoke object URL; client validation; sends request per §7.1; OCR chip & extracted-text panel render. | Manual journey D.3 with real image; tracker §F | 50m | TODO |
| T4-05 | Screenshot test cases | P1 | G | T4-02 | `fixtures/images/*.png`, `evals/datasets/screenshots.jsonl` | ≥4 **synthetic** screenshots made by hand/generated (fake bank SMS, fake job offer chat, fake payment request, benign delivery notification); each with expected risk *range* and key phrases; no real personal data or real brands' private data. | `npx tsx scripts/run-evals.ts --set screenshots` (after T1-05 runner exists) | 35m | TODO |

### Phase 5 — Quality

| ID | Task | Pri | Agent | Deps | Expected files | Acceptance criteria | Verification | Est | Status |
|---|---|---|---|---|---|---|---|---|---|
| T5-01 | No-network & logging safety tests | P0 | X | T2-11 | `tests/integration/api/safety.test.ts` | Asserts: URL input triggers no outbound call other than the injected provider; captured log lines never contain input text; error responses omit stack traces/key. | `npx vitest run tests/integration/api/safety.test.ts` | 25m | TODO |
| T5-02 | Adversarial prompt-injection evals | P0 | G | T1-05 | `evals/datasets/adversarial.jsonl`, `scripts/run-evals.ts`, `evals/results/adversarial-<date>.json` | ≥15 cases (instruction override, fake system tags, nonce-forgery attempt, Hindi/Hinglish injection, "output Low", HTML/JS payloads, very long inputs); runner reports per-case: valid JSON?, risk label, injection flagged?, any leaked instructions? Results (pass and fail) in tracker §F; failures fed back as prompt fixes (own files) or defects to owners. | `npx tsx scripts/run-evals.ts --set adversarial` | 45m | TODO |
| T5-03 | Eval datasets (phishing/benign) & Hindi quality review | P1 | G | T1-05 | `evals/datasets/{phishing,benign}.jsonl`, `evals/hindi-review.md` | ≥12 phishing (SMS, WhatsApp, email, job, KYC, lottery, advance-fee, URL-only) and ≥8 benign (genuine bank OTP notices with "don't share" language, delivery updates, OTPs, normal chats) — synthetic; expected risk ranges documented; Hindi outputs sampled and rated; lexicon false-positive/negative notes handed to Codex. | `npx tsx scripts/run-evals.ts --set phishing,benign` | 50m | TODO |
| T5-04 | Security review | P0 | C | T2-10, T3-10 | `docs/security-review.md` | Checklist from Architecture §8 walked: secrets grep (repo + build output), CSP headers set in `next.config`, no `dangerouslySetInnerHTML`, no anchors to analyzed URLs, rate-limit behavior, logging review, dependency audit output pasted. Findings filed as tasks. | `grep -R "dangerouslySetInnerHTML" src \|\| true; npm audit --omit=dev` | 35m | TODO |
| T5-05 | Accessibility & responsive pass | P1 | X | T3-10 | fixes across components | Keyboard-only run of D.1/D.2/D.5; visible focus; labels; reduced-motion; 375px, 768px, 1280px layouts with no horizontal scroll; contrast check of token pairs. | Manual checklist recorded in tracker §F | 40m | TODO |
| T5-06 | Cross-module integration review | P0 | C | T3-10 | review notes in tracker §C | Types/contract drift check: `tsc` clean; API example from Architecture §7.4 matches a real response; UI mapping table (UI-registery E.2) matches; ownership violations (AGENTS.md §4) checked via `git log --stat`. | `npm run typecheck && npm test` | 30m | TODO |
| T5-07 | Performance pass | P2 | X | T3-10 | tweaks | Bundle check (`next build` output), lazy-load Motion on report only, no layout shift on results. | `npm run build` size table | 20m | TODO |
| T5-08 | Playwright E2E | P2 | X | T3-10 | `tests/e2e/*` | Three journeys against fake provider. | `npx playwright test` | 45m | TODO |

### Phase 6 — Deployment

| ID | Task | Pri | Agent | Deps | Expected files | Acceptance criteria | Verification | Est | Status |
|---|---|---|---|---|---|---|---|---|---|
| T6-01 | DO app spec + build config | P0 | X | T0-02, T0-05 | `.do/app.yaml`, `package.json` engines/start script | Spec: GitHub source/branch `main`, build `npm ci && npm run build`, run `npm start`, http_port, health check `/api/health`, env vars from Architecture §9.3 with `DO_GENAI_API_KEY` as secret **placeholder (no value)**. | `npm run build && PORT=8080 npm start` then `curl localhost:8080/api/health` | 20m | TODO |
| T6-02 | **Early skeleton deploy** | P0 | X (+H2) | T6-01, T0-06 | tracker §G | App pushed to GitHub; DO app created (human); first deployment succeeds; live `/api/health` returns 200. **Target: by 13:30 IST.** Record live URL and DO build log issues. | `curl -i https://<live>/api/health` | 30m | TODO |
| T6-03 | Final deploy with secrets | P0 | X (+H2) | T6-02, T5-06, T5-04 | tracker §G | Secret set in DO console (human); latest `main` deployed; known-good commit hash recorded **before** deploy; rollback path confirmed to exist. | `curl` health + T6-04 | 20m | TODO |
| T6-04 | Live smoke test script | P0 | G | T6-02 | `scripts/smoke-live.ts` | Takes base URL arg; checks health; text analysis → valid report with `model.usedModel` non-null; URL analysis; oversized body → 413; invalid body → 400; prints pass/fail table; never sends real personal data. Evidence pasted to tracker §F. | `npx tsx scripts/smoke-live.ts https://<live>` | 25m | TODO |
| T6-05 | Mobile & browser live check | P0 | G/H | T6-03 | tracker §G | Live site opened on a phone-width viewport and one real phone (human) — landing, text journey, URL journey (and screenshot if shipped). Defects logged. | Manual; record | 15m | TODO |

### Phase 7 — Hackathon presentation

| ID | Task | Pri | Agent | Deps | Expected files | Acceptance criteria | Verification | Est | Status |
|---|---|---|---|---|---|---|---|---|---|
| T7-01 | Synthetic demo scenarios | P0 | G | T0-04 | `src/lib/demo/scenarios.ts`, `public/demo/*` | ≥5 scenarios: bank KYC phishing SMS (id `bank-kyc-phish`), WhatsApp job offer with registration fee, lookalike-domain URL, fake payment-request screenshot (P1), a **benign** genuine-style notice (shows Low). All synthetic, no real brands' trademarks beyond names needed for realism, no real phone numbers/URLs resolving to live malware (use reserved/invalid domains where practical, e.g. `.example`/`.invalid` or clearly nonexistent). Each rehearsed against real pipeline; actual outcomes recorded. | `npx vitest run tests/unit/demo` (schema) + manual run | 40m | TODO |
| T7-02 | README | P0 | C | T6-02 | `README.md` | What/why, screenshots, architecture overview + diagram, setup & env, how DigitalOcean Open-Weight AI (Llama 3.3/3.1) is used, **honest limitations**, privacy disclosure (content sent to DigitalOcean GenAI endpoint; retention cited from DO terms), security notes, testing commands, license placeholder/choice noted for human, team/agent workflow note. | Render check; all commands in it executed once | 35m | TODO |
| T7-03 | Pitch narrative & demo script | P0 | C | T7-01 | `docs/pitch.md`, `docs/demo-script.md` | 3–5 min script with exact clicks, timings, fallback lines per step; technical talking points (deterministic + DigitalOcean open-weight AI + verification, honest uncertainty, EN/HI, open source); Q&A prep incl. "how do you prevent hallucination/injection?". | Dry-run read-through by C; time it | 30m | TODO |
| T7-04 | Screenshots & assets | P0 | G/H | T6-03 | `docs/screenshots/*.png` | ≥4 screenshots from the **live** app (landing, High-risk result, URL forensics, Hindi view) taken with synthetic inputs. | `ls docs/screenshots` | 15m | TODO |
| T7-05 | Backup demo | P1 | H | T6-03 | `docs/backup-demo.mp4` (or hosted link) | Screen recording (human) of a real run of the live app; labelled "recorded real run". Also: run the local build as second fallback. **No** pre-baked fake results inside the app. | File plays | 15m | TODO |
| T7-06 | Final submission | P0 | C/H | T6-03, T6-04, T7-02, T7-03, T7-04 | tracker §H | Submission form completed with repo URL, live URL, description; links verified logged-out; repo public; no secrets (final `git log -p` grep); tracker §H all DONE or consciously waived. **Submit by 16:00 IST.** | Open each submitted link in a private window | 20m | TODO |

---

## 4. Agent Workload View (initial assignment)

| Agent | P0 tasks (approx. est. total) | Notes |
|---|---|---|
| Claude | T0-04, T0-05, T0-06, T1-03, T1-04, T2-05, T2-06, T2-07, T2-08, T5-04, T5-06, T7-02, T7-03, T7-06 (~7h focused) | Heaviest on the critical path; **start T0-04 first**. Over capacity → hand T2-07 to Gemini (content-heavy) with Claude review. |
| Codex | T0-02, T0-03, T1-01, T2-01..04, T2-09..11, T3-01..10, T5-01, T6-01..03 (~11h focused) | Largest load; mitigation: frontend (T3) and security (T2-01..04) are independent streams — if a second Codex session exists, split by those; else defer T3-11, P1/P2. |
| Gemini | T0-01, T1-02, T1-05, T5-02, T6-04, T7-01, (+P1 T4-02, T4-05, T5-03) (~4h) | Under-loaded: **offload candidates:** T2-07 recommendation copy, T2-04 lexicon authoring (hand to Codex as data file), T7-04. |

Totals exceed wall-clock because streams run in parallel across agents; the plan assumes ≥2 agents active simultaneously. **If only one agent is active at a time, use the Fallback Scope (§6) immediately.**

## 5. Phase Exit Checklists

- **Phase 0:** `date` checked; T0-01 recorded (even if failing); build green; types merged; `.env` not tracked.
- **Phase 1:** real DigitalOcean open-weight model returned parseable JSON at least once, evidence recorded.
- **Phase 2:** API integration tests green; manual curl of High-risk and benign synthetic example recorded.
- **Phase 3:** text + URL journeys in browser, mobile viewport check.
- **Phase 6a (early deploy):** live health 200 or documented blocker with owner.
- **Freeze (14:45):** create tag `mvp-freeze`; after this only bug fixes, docs, demo prep.
- **Final:** `npm run typecheck && npm run lint && npm test && npm run build` all green with outputs pasted in tracker §F.

## 6. Fallback Scope (decision points)

| If at… | And… | Then |
|---|---|---|
| 12:30 | T0-01 shows DigitalOcean GenAI API unusable (auth/quota/endpoint error) | Escalate to human immediately (H1). Continue building everything else against fake provider; the product still ships `deterministic_only` honestly labelled; **preserve open-weight model focus per track rules**. |
| 13:30 | Phase 3 text/URL journey not working | Claude + Gemini stop all P1/P2; Codex focuses T3-10 only; Gemini does manual QA; cut ExportReportButton, ScreenshotUploader, Sidebar. |
| 13:30 | Early deploy failing | Codex + human triage DO build logs for max 30 min; fallback: second target (any host the human chooses) is a **human decision**; record in ADR. Local-run demo remains the guaranteed fallback. |
| 14:00 | Screenshot mode not working | Cut P1 screenshot from the live UI (hide tab; don't leave a broken control); keep code on a branch; demo with text/URL; mention as roadmap truthfully. |
| 14:45 | Any | Freeze. Only P0 bugs. |
| 15:30 | Live app unstable | Roll back to last known-good deployment; demo from it or from local build; backup video ready. |

**Cut order (first to drop):** T5-08, T5-07, Sidebar (P2), T7-05, T3-11 export (keep Copy summary + JSON only), T4-* screenshot, T5-03 Hindi review depth, T5-05 polish. **Never cut:** honesty copy (limitations, model disclosure), rate limiting, input limits, secret handling, deploy, README.

## 7. Definition of "MVP Done"

1. Live HTTPS URL; `/api/health` OK. 2. Text and URL inputs produce a validated, explainable report from **real DigitalOcean Open-Weight AI** (`model.usedModel` shows the model ID) or an explicitly labelled deterministic-only report. 3. EN/HI switch works. 4. Evidence highlighting + provenance labels work. 5. Limitations always visible. 6. Tests (unit + integration) green with evidence. 7. README, screenshots, demo script exist. 8. Submission made.
