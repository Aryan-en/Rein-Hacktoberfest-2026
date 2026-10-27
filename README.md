<div align="center">

# 🛡️ TrustLens AI

### Understand the Threat. Verify the Evidence. Stay Protected.

An open-source, evidence-based scam and phishing investigation platform powered by **DigitalOcean GenAI & Open-Weight AI (Llama 3.3 / 3.1)**.

![Status](https://img.shields.io/badge/status-in%20development-F59E0B)
![Next.js](https://img.shields.io/badge/Next.js-App%20Router-000000?logo=nextdotjs)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![Model](https://img.shields.io/badge/AI-DigitalOcean%20GenAI%20(Open--Weight)-0080FF?logo=digitalocean)
![Event](https://img.shields.io/badge/Hacktoberfest%20Hack%20Day-Chandigarh%202026-3B82F6)

</div>

---

> ## ⚠️ Project status — please read
> TrustLens AI is being built for **Hacktoberfest Hack Day Chandigarh 2026** (Track: **Best Open-Source AI Project by DigitalOcean**, submission deadline **27 Oct 2026, 16:30 IST**).
>
> **Today the repository contains the full engineering specification (`context/`) and a stock `create-next-app` scaffold. The investigation features described below are _designed, not yet implemented_.** This README marks every capability with a status badge, and the live status is tracked in [`context/Progress-tracker.md`](context/Progress-tracker.md). Nothing here is claimed as working, tested, or deployed until that tracker records execution evidence.
>
> | Marker | Meaning |
> |---|---|
> | 📐 **Specified** | Designed in the docs; no code yet |
> | 🚧 **In progress** | Being implemented |
> | ✅ **Verified** | Implemented and tested, with evidence in the tracker |
>
> As of this commit, nothing is marked ✅.

---

## Table of contents

1. [What is TrustLens?](#1-what-is-trustlens)
2. [Why it is different](#2-why-it-is-different)
3. [Features](#3-features)
4. [How an investigation works](#4-how-an-investigation-works)
5. [Evidence you can trust (and evidence you shouldn't)](#5-evidence-you-can-trust-and-evidence-you-shouldnt)
6. [Risk classification](#6-risk-classification)
7. [System design & architecture](#7-system-design--architecture)
8. [How DigitalOcean Open-Weight AI is used](#8-how-digitalocean-open-weight-ai-is-used)
9. [Technology stack](#9-technology-stack)
10. [Getting started](#10-getting-started)
11. [Configuration](#11-configuration)
12. [API reference](#12-api-reference)
13. [Project structure](#13-project-structure)
14. [Testing & evaluation](#14-testing--evaluation)
15. [Security model](#15-security-model)
16. [Privacy](#16-privacy)
17. [Deployment (DigitalOcean App Platform)](#17-deployment-digitalocean-app-platform)
18. [Limitations & honesty statement](#18-limitations--honesty-statement)
19. [Roadmap](#19-roadmap)
20. [Multi-agent development workflow](#20-multi-agent-development-workflow)
21. [Documentation map](#21-documentation-map)
22. [Contributing](#22-contributing)
23. [License](#23-license)
24. [Acknowledgements](#24-acknowledgements)

---

## 1. What is TrustLens?

Scams are increasingly personal: a WhatsApp "job offer", a bank-KYC SMS, a lookalike payment link, a screenshot of a "customer-care" chat. People need to know **why** something looks suspicious, not just a verdict.

TrustLens accepts suspicious content, investigates it with a combination of **deterministic security analysis** and **DigitalOcean open-weight model reasoning (Llama 3.3/3.1)**, and produces an **explainable report** that shows exactly what was found, how it was found, and what we could _not_ determine.

**Supported inputs**

| Input | Examples |
|---|---|
| 💬 Text | SMS, WhatsApp messages, emails, job offers, payment requests |
| 🔗 URL | Links from messages or ads (analyzed **structurally only, never opened**) |
| 🖼️ Screenshot | Chat screenshots, fake websites, payment screens (PNG / JPEG / WebP) |

**Every report contains** *(📐 Specified)*

1. Risk classification: **Low · Medium · High · Unknown**
2. Threat category (phishing, advance-fee, job scam, impersonation, …)
3. The exact suspicious phrases, highlighted in your message
4. URL and domain structural analysis
5. AI-generated contextual explanation
6. Manipulation techniques identified (urgency, fear, authority, …)
7. Recommended protective actions
8. English **and** Hindi (हिन्दी) explanations
9. Explicit limitations and uncertainty
10. Downloadable/printable report

TrustLens is **not** a chatbot, not a generic LLM wrapper, and **never** shows a made-up "87% scam" number.

---

## 2. Why it is different

| Typical "scam checker" | TrustLens |
|---|---|
| One opaque percentage | Ordinal label **plus** the rules that produced it |
| LLM output shown as-is | LLM output **validated against a schema** and every quoted phrase **verified to exist** in your input |
| Model can say anything | Model **cannot raise risk to High without a verified quote**, and **cannot lower risk below deterministic findings** |
| Fetches the link to "scan" it | **Never opens, resolves, or fetches** submitted URLs, which removes SSRF and avoids touching live malware |
| Silent model swaps | Report always states **which model actually ran**; fallback stays within open-weight models on DigitalOcean, then degrades to rules-only, clearly labelled |
| English only | English **and** Hindi from one inference call |
| "Safe" badge | Low means *"no strong indicators found"*, never *"safe"* |

---

## 3. Features

| Feature | Priority | Status |
|---|---|---|
| Text investigation (SMS / WhatsApp / email) | P0 | 📐 Specified |
| URL structural forensics (host breakdown, registrable domain, signals) | P0 | 📐 Specified |
| DigitalOcean Open-Weight AI explanation, manipulation techniques, categories | P0 | 📐 Specified |
| Deterministic signals: IP-host, userinfo `@`, punycode/IDN, lookalike & brand-mismatch domains, deceptive subdomains, shorteners, encoding abuse | P0 | 📐 Specified |
| Text signals: urgency, threats, credential/OTP requests, advance-fee, remote-access requests, off-platform migration (EN / Hindi / Hinglish) | P0 | 📐 Specified |
| Evidence verification (quote must exist in input) | P0 | 📐 Specified |
| Explainable risk classification with rationale | P0 | 📐 Specified |
| English ⇄ Hindi switch | P0 | 📐 Specified |
| Evidence ↔ highlight linking in the message | P0 | 📐 Specified |
| Model disclosure & graceful degradation | P0 | 📐 Specified |
| Rate limiting, input limits, safe logging | P0 | 📐 Specified |
| Screenshot (multimodal) investigation with OCR caveats | P1 | 📐 Specified |
| Report export (JSON / Markdown / Print-to-PDF / copy) | P1 | 📐 Specified |
| Session history sidebar (in-memory) | P2 | 📐 Specified |
| Playwright end-to-end tests | P2 | 📐 Specified |

---

## 4. How an investigation works

```
User Input → Validation → Normalization → URL & Text Heuristics → DigitalOcean Open-Weight Inference
          → Response Validation → Evidence Verification → Risk Classification → Investigation Report
```

```mermaid
sequenceDiagram
  autonumber
  actor U as User
  participant UI as Browser UI
  participant API as /api/analyze
  participant SEC as Security Engine
  participant AI as AI Orchestrator
  participant DO as DigitalOcean GenAI (Open-Weight)
  participant V as Verifier + Classifier

  U->>UI: Paste text / URL / screenshot
  UI->>API: POST AnalyzeRequest
  API->>API: Rate limit · Zod validation · size / magic-byte checks
  API->>SEC: Normalize · extract URLs · run heuristics
  SEC-->>API: Signals + URL analyses
  API->>AI: Build fenced prompt (signals as hints)
  AI->>DO: chat.completions.create (primary open-weight model)
  alt primary fails or times out
    AI->>DO: chat.completions.create (fallback open-weight model)
  end
  DO-->>AI: JSON findings
  AI->>AI: Parse · Zod validate · one repair retry
  AI-->>API: Findings or failure
  API->>V: Verify quotes · reconcile with deterministic floor
  V-->>API: Classification + rationale
  API-->>UI: InvestigationReport (model.used disclosed)
```

| Stage | What happens | If it fails |
|---|---|---|
| Validation | Zod schema, size limits, MIME and magic-byte checks | `400 / 413 / 415` |
| Normalization | Unicode NFKC, strips zero-width / bidi characters (and records that it did) | Never fails |
| Heuristics | Deterministic signals with bilingual explanations | Per-URL failure becomes an observation |
| DigitalOcean AI inference | Fenced prompt, JSON output, timeout, fallback chain | Degrades to rules-only report |
| Response validation | Extract JSON → schema check → one repair retry | Treated as model failure |
| Evidence verification | Each quoted phrase is string-matched against the source | Unverified items are labelled and can't escalate risk |
| Classification | Pure deterministic function (§6) | Never throws |

---

## 5. Evidence you can trust (and evidence you shouldn't)

TrustLens refuses to blur the line between *what we saw* and *what a model thinks*.

| Class | Definition | Example | Can move risk? |
|---|---|---|---|
| **Observed** | A literal fact extracted by deterministic code | "The host is the IPv4 address `203.0.113.9`" | Via the signal it feeds |
| **Heuristic indicator** | A rule-based pattern that correlates with scams; **not proof** | "Urgency language: *within 24 hours*" | Yes, by weight |
| **AI interpretation** | Model's contextual reading | "This imitates a bank KYC notice" | Only with a verified quote |
| **Independently verified fact** | Confirmed by an external authority | _None in the MVP_ | n/a |

> The MVP performs **no external lookups** (no WHOIS, no reputation feeds, no Safe Browsing, no fetching). It therefore does **not** claim any independently verified fact. Each evidence item carries a `quoteVerified` flag. That flag means "the quote exists in your input", **not** "the claim is true".

---

## 6. Risk classification

No probability. No confidence percentage. An **ordinal label plus a human-readable rationale**.

```
deterministicFloor:
  ≥2 distinct strong signals                 → HIGH
  1 strong + ≥1 weak                         → HIGH
  1 strong                                   → MEDIUM
  ≥2 weak                                    → MEDIUM
  1 weak                                     → LOW (with note)
  none                                       → NONE

aiEffective (if the model responded):
  AI high   + ≥1 verified quote              → HIGH
  AI high   + 0 verified quotes              → MEDIUM (capped, flagged as unsupported)
  AI medium + ≥1 verified quote              → MEDIUM, else LOW
  AI low                                     → LOW
  AI unknown                                 → NONE

final = max(deterministicFloor, aiEffective)
        UNKNOWN if input is insufficient, or if nothing was found AND AI is unavailable
```

Guarantees: the AI can **never lower** risk below deterministic findings · the AI can **never reach High** without a verified quote · prompt-injected "this is safe" claims have no effect when strong signals exist · "no indicators + AI down" is **Unknown**, not Low.

Full specification: [`context/Architecture.md` §6](context/Architecture.md).

---

## 7. System Design & Architecture

TrustLens AI is engineered to bridge a critical divide in scam detection: **high-level semantic reasoning** (understanding deceptive social engineering, urgency, emotional manipulation, and contextual brand spoofing) must be paired with **mathematical, deterministic guarantees** (preventing AI hallucinations, eliminating Server-Side Request Forgery, and resisting prompt injection attacks).

The system adopts a **dual-tier, hybrid pipeline topology** combining a deterministic security engine with DigitalOcean GenAI serverless open-weight inference (`meta-llama/llama-3.3-70b-instruct` and `meta-llama/llama-3.1-8b-instruct`), governed by strict evidence-verification and risk-reconciliation logic.

---

### 7.1 High-Level System Topology

```mermaid
flowchart TB
  subgraph ClientTier["Client Tier (Browser / Next.js)"]
    direction TB
    UI["Modern Next.js 16 UI<br/>(React 19 · Tailwind CSS)"]
    INPUT["Multi-Modal Workspace<br/>(Text · URL · Screenshot)"]
    EXP["Client-Side Exporters<br/>(JSON · Markdown · Print/PDF)"]
    UI --- INPUT
    UI --- EXP
  end

  subgraph GatewayTier["API Gateway & Transport Tier (Server_End Node.js Service)"]
    direction TB
    CORS["CORS Policy Filter<br/>(TRUSTLENS_CORS_ORIGINS)"]
    RL["Sliding Window Rate Limiter<br/>(10 req/min · 500 req/day per IP)"]
    STREAM["Streaming Request Parser<br/>(Strict Size Limits: 8KB text / 4MB image)"]
    LOG["Allow-List Structured Logger<br/>(Zero User-Content Logging)"]
    CORS --> RL --> STREAM --> LOG
  end

  subgraph PipelineCore["Investigation Pipeline Core"]
    direction TB
    NORM["Normalization Engine<br/>(NFKC · Zero-Width Stripping · BiDi Defenses)"]
    
    subgraph EngineSplit["Dual Engine Execution"]
      direction LR
      SEC["Deterministic Security Engine<br/>• URL Syntactic Forensics (tldts)<br/>• Brand Lookalike Matching<br/>• Deceptive Subdomains / Homoglyphs<br/>• Lexical Urgent/Threat Patterns"]
      
      AI_ORCH["DigitalOcean AI Orchestrator<br/>• Nonce Data-Fencing (Anti-Injection)<br/>• Prompt Assembly & JSON Constraints<br/>• Fallback Cascade & Timeout Controls<br/>• Automated 1-Shot Repair Retry"]
    end

    VER["Evidence Verifier<br/>(Exact Substring Quote Matching)"]
    RECON["Risk Reconciliation Engine<br/>(Deterministic Floor vs. AI Effective)"]
    REP["Report Assembler<br/>(Bilingual EN/HI Synthesis)"]

    NORM --> EngineSplit
    SEC --> RECON
    AI_ORCH --> VER
    VER --> RECON
    RECON --> REP
  end

  subgraph DOGenAI["DigitalOcean GenAI Platform (Serverless Inference)"]
    direction TB
    PRIMARY["Primary Model:<br/>meta-llama/llama-3.3-70b-instruct"]
    FALLBACK["Fallback Model:<br/>meta-llama/llama-3.1-8b-instruct"]
    PRIMARY -.->|on timeout or failure| FALLBACK
  end

  %% Connections
  INPUT ==>|HTTPS POST /api/analyze| CORS
  LOG --> NORM
  AI_ORCH <==>|HTTPS POST /v1/chat/completions<br/>(ONLY Outbound Network Call)| PRIMARY
  REP ==>|200 OK InvestigationReport| UI
```

> [!IMPORTANT]
> **The Zero-SSRF / No-Browsing Boundary**: The TrustLens server makes **exactly one outbound network call**: an HTTPS request to the DigitalOcean GenAI serverless inference endpoint (`https://inference.do-ai.run/v1`). Submitted URLs are **never fetched, resolved, or probed via DNS**. All URL forensics are purely syntactic and offline.

---

### 7.2 Subsystem Breakdown & Architecture Layers

The architecture is partitioned into six decoupled subsystems:

| # | Subsystem | Implementation Location | Core Responsibilities & Invariants |
|---|---|---|---|
| **1** | **Ingestion & Transport** | [`Server_End/src/server.ts`](file:///Users/aryansingh/Documents/Hacktoberfest2026/Rein-Hacktoberfest-2026/Server_End/src/server.ts)<br/>[`Server_End/src/app.ts`](file:///Users/aryansingh/Documents/Hacktoberfest2026/Rein-Hacktoberfest-2026/Server_End/src/app.ts) | • Node.js HTTP server (zero heavy frameworks, minimal footprint)<br/>• CORS validation against configurable origin allowlist (`TRUSTLENS_CORS_ORIGINS`)<br/>• Streaming chunked reader with strict abort-on-limit (8 KiB text, 4 MiB image)<br/>• Magic-byte verification for image formats (`image/png`, `image/jpeg`, `image/webp`)<br/>• Sliding-window IP rate limiting (10 req/min, 500 req/day per IP/proxy hop) |
| **2** | **Normalization & Text Defense** | [`Server_End/src/security/normalize.ts`](file:///Users/aryansingh/Documents/Hacktoberfest2026/Rein-Hacktoberfest-2026/Server_End/src/security/normalize.ts)<br/>`Server_End/src/security/text/` | • Unicode NFKC normalization to defeat visual spoofing & obfuscation<br/>• Strips zero-width characters (ZWSP, ZWNJ, ZWJ) and bidirectional overrides (RLO/LRO)<br/>• Preserves offset maps for faithful evidence highlighting<br/>• Context-aware lexical regex analyzers (e.g. distinguishing legitimate "never share OTP" from malicious "share your OTP") |
| **3** | **Offline URL Forensics** | `Server_End/src/security/url/` | • Strict syntactic parsing via `WHATWG URL` & `tldts` (public suffix extraction)<br/>• Brand lookalike detection against a curated registry of 50+ banking, e-commerce, & telecom domains (e.g., `sbi.co.in`, `hdfcbank.com`, `paypal.com`)<br/>• Detects deceptive subdomain spoofing (e.g., `paypal.com.account-verify.xyz`)<br/>• Punycode & IDN homoglyph flagging (e.g., `xn--...` Cyrillic spoofing)<br/>• Direct IP-address host identification & known URL-shortener flagging |
| **4** | **AI Orchestration & Fallback** | `Server_End/src/ai/`<br/>[`Server_End/src/ai/providers/digitalocean.ts`](file:///Users/aryansingh/Documents/Hacktoberfest2026/Rein-Hacktoberfest-2026/Server_End/src/ai/providers/digitalocean.ts) | • Clean `AiProvider` interface abstraction; single OpenAI-compatible adapter<br/>• Cryptographic nonce-fencing (`<<<UNTRUSTED_CONTENT_nonce>>>`) to quarantine input<br/>• Automated fallback chain: `Llama 3.3 70B` → `Llama 3.1 8B` → `deterministic_only`<br/>• Configurable request timeouts with `AbortController` (default 12s)<br/>• Dual-mode JSON extraction: Native JSON mode + prompt-instructed JSON with 1-shot repair |
| **5** | **Evidence Verifier & Risk Floor** | `Server_End/src/analysis/` | • Strict verbatim substring verification: any model finding without an exact match in the normalized input is flagged `unverified` and stripped of risk-escalation power<br/>• Computes non-negotiable **Deterministic Risk Floor** from heuristic signals<br/>• Reconciles final risk level: `finalRisk = max(deterministicFloor, aiEffective)`<br/>• Guarantees that AI hallucination or prompt injection can never lower risk |
| **6** | **Presentation & Local Export** | Root `app/`, `src/components/` | • Next.js 16 App Router UI with responsive, dark-mode accessible design<br/>• Dynamic bilingual toggle (English / Hindi) with seamless zero-re-query switching<br/>• Inert URL rendering (plain text/copyable, zero live hyperlinking) to protect users<br/>• 100% Client-side export (Markdown, JSON, Print-to-PDF); zero database persistence |

---

### 7.3 Detailed End-to-End Sequence Flow

The following sequence details how a request traverses validation, security forensics, AI orchestration with fallback handling, evidence verification, and response assembly:

```mermaid
sequenceDiagram
  autonumber
  actor User as End User
  participant UI as Next.js Web Client
  participant Server as Server_End (HTTP Service)
  participant SecEng as Security Forensics Engine
  participant Orch as AI Orchestrator
  participant DO_Primary as DO GenAI: Llama 3.3 70B
  participant DO_Fallback as DO GenAI: Llama 3.1 8B
  participant Verifier as Evidence & Risk Reconciler

  User->>UI: Submit text, suspicious URL, or screenshot
  UI->>Server: POST /api/analyze (JSON payload)
  
  Note over Server: 1. Gatekeeping & Sanitization
  Server->>Server: Verify Origin (CORS) & Check Rate Limits
  Server->>Server: Stream body & enforce size caps (8KB text / 4MB image)
  Server->>Server: Validate payload structure against Zod Request Schema
  
  Note over Server,SecEng: 2. Normalization & Forensics
  Server->>SecEng: Normalize text (NFKC, strip zero-width & bidi)
  SecEng->>SecEng: Parse URLs (tldts) & check brand registry / homoglyphs / IP hosts
  SecEng->>SecEng: Extract lexical patterns (urgency, threats, credential requests)
  SecEng-->>Server: Return deterministic Signals[] & UrlAnalysis[]
  
  Note over Server,Orch: 3. AI Orchestration with Nonce Fencing
  Server->>Orch: Dispatch normalized text + signals as hints
  Orch->>Orch: Generate cryptographic nonce delimiter & wrap untrusted text
  
  alt Primary Inference (Llama 3.3 70B)
    Orch->>DO_Primary: POST /v1/chat/completions (timeout: 12s)
    DO_Primary-->>Orch: 200 OK (Structured JSON response)
  else Primary Fails / Times Out
    Note over Orch,DO_Fallback: Fallback Activation
    Orch->>DO_Fallback: POST /v1/chat/completions (timeout: 12s)
    DO_Fallback-->>Orch: 200 OK (Structured JSON response)
  else Both Models Fail
    Note over Orch: Graceful Degradation
    Orch-->>Server: ModelFailure (degraded_model_failed, rules-only mode)
  end

  alt Model Output Validation
    Orch->>Orch: Parse JSON & validate against ModelFindingsSchema
    opt Invalid JSON
      Orch->>DO_Primary: 1-shot repair retry with error trace
    end
  end
  Orch-->>Server: ModelFindings (techniques, quotes, bilingual rationale)

  Note over Server,Verifier: 4. Evidence Verification & Risk Floor Reconciliation
  Server->>Verifier: Reconcile ModelFindings with Source Text & Signals
  Verifier->>Verifier: Exact substring match for each quoted evidence item
  Verifier->>Verifier: Compute Deterministic Floor (High / Medium / Low / None)
  Verifier->>Verifier: Reconcile: finalRisk = max(deterministicFloor, aiEffective)
  Verifier-->>Server: Final Classification & Verified Evidence Items

  Note over Server,UI: 5. Response Dispatch
  Server-->>UI: 200 OK (InvestigationReport with model disclosure & timings)
  UI->>User: Render interactive verdict, forensic cards & verified quotes
```

---

### 7.4 Data Architecture & Contract Specifications

TrustLens enforces end-to-end type safety between the frontend client and backend runtime. The core interfaces are defined in TypeScript:

```
┌────────────────────────────────────────────────────────┐
│                   AnalyzeRequest                       │
│  - inputType: "text" | "url" | "image"                 │
│  - text? / url? / image? { mimeType, dataBase64 }      │
│  - clientLanguage?: "en" | "hi"                        │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                   ModelFindings                        │
│  - summary: { en: string, hi: string }                 │
│  - modelRiskAssessment: "high" | "medium" | "low"      │
│  - techniques: TechniqueIdentifier[]                   │
│  - evidence: Array<{ quote: string, reasoning: {...} }>│
│  - recommendations: { en: string[], hi: string[] }     │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                InvestigationReport                     │
│  - id: UUID (ephemeral)                                │
│  - timestamp: ISO 8601                                 │
│  - risk: { level: RiskLevel, rationale: BilingualText }│
│  - deterministicFloor: RiskLevel                       │
│  - signals: Signal[] (type, severity, rationale)       │
│  - urlAnalyses: UrlAnalysis[] (forensic details)       │
│  - evidence: EvidenceItem[] (quoteVerified: boolean)   │
│  - model: ModelDisclosure (requested, used, fellBack)  │
│  - performance: { durationMs, stages: TimingBreakdown }│
└────────────────────────────────────────────────────────┘
```

#### Deterministic Risk Reconciliation Matrix

The final risk assessment is deterministically governed by the following mathematical truth table:

| Deterministic Signals Found | Deterministic Floor | Model Assessment | Verified Evidence Quotes | Final Reconciled Risk |
|---|---|---|---|---|
| ≥ 2 Strong signals (e.g. Brand Lookalike + Credential Grab) | **HIGH** | Any (or model down) | Any | **HIGH** *(AI cannot lower)* |
| 1 Strong + ≥ 1 Weak signal | **HIGH** | Any (or model down) | Any | **HIGH** *(AI cannot lower)* |
| 1 Strong signal (e.g. Lookalike Domain) | **MEDIUM** | Low / None | Any | **MEDIUM** *(AI cannot lower)* |
| 1 Strong signal | **MEDIUM** | High | ≥ 1 Verified Quote | **HIGH** *(AI escalates with proof)* |
| 0 Signals (Clean text/URL) | **NONE** | High | ≥ 1 Verified Quote | **HIGH** *(AI escalates with proof)* |
| 0 Signals | **NONE** | High | 0 Verified Quotes | **MEDIUM** *(Capped: unverified claim)* |
| 0 Signals | **NONE** | Medium | ≥ 1 Verified Quote | **MEDIUM** |
| 0 Signals | **NONE** | Low / None | N/A | **LOW / NONE** |
| 0 Signals | **NONE** | Model Failed / Timeout | N/A | **UNKNOWN** *(Transparent disclosure)* |

---

### 7.5 Architectural Principles & Decision Records

The architecture is guided by 5 core engineering tenets recorded in our Architectural Decision Records (ADRs):

1. **Deterministic Priority ([ADR-003](file:///Users/aryansingh/Documents/Hacktoberfest2026/Rein-Hacktoberfest-2026/context/Architecture.md#L726))**: The heuristic engine executes prior to and completely independent of the AI model. If the AI service is unavailable, degraded, or times out, the user still receives an accurate, explainable forensic assessment.
2. **Zero-SSRF Sandbox ([ADR-004](file:///Users/aryansingh/Documents/Hacktoberfest2026/Rein-Hacktoberfest-2026/context/Architecture.md#L727))**: The server never touches, crawls, or resolves submitted URLs. Analysis is performed 100% syntactically through public suffix parsing, domain math, homoglyph evaluation, and pattern matching.
3. **Stateless Privacy & Ephemerality ([ADR-002](file:///Users/aryansingh/Documents/Hacktoberfest2026/Rein-Hacktoberfest-2026/context/Architecture.md#L725), [ADR-012](file:///Users/aryansingh/Documents/Hacktoberfest2026/Rein-Hacktoberfest-2026/context/Architecture.md#L735))**: Zero database storage, zero cookie tracking, and zero log retention of submitted text. Structured server logs drop all payload data by schema. Report exports (Markdown, JSON, PDF) are generated in-memory on the client.
4. **Open-Weight AI Sovereignty ([ADR-006](file:///Users/aryansingh/Documents/Hacktoberfest2026/Rein-Hacktoberfest-2026/context/Architecture.md#L729))**: Uses open-weight models (`meta-llama/llama-3.3-70b-instruct` and `meta-llama/llama-3.1-8b-instruct`) hosted on DigitalOcean GenAI serverless infrastructure, guaranteeing reproducible, open-source AI lineage.
5. **Verified Evidence Mandate ([ADR-007](file:///Users/aryansingh/Documents/Hacktoberfest2026/Rein-Hacktoberfest-2026/context/Architecture.md#L730))**: LLM findings cannot trigger high-severity classifications unless supported by exact, cryptographically verified verbatim substring quotes extracted from the user's submission.

Details, full ADRs, and the formal threat model live in [`context/Architecture.md`](context/Architecture.md).

---

## 8. How DigitalOcean Open-Weight AI is used

| Aspect | Design | Verification status |
|---|---|---|
| Models | `meta-llama/llama-3.3-70b-instruct` (primary) → `meta-llama/llama-3.1-8b-instruct` (fallback) via DigitalOcean GenAI Platform | Configured via DigitalOcean dashboard; **to be called with our key** (task T0-01) |
| SDK | `openai` client configured with DigitalOcean GenAI `baseURL` | Standard OpenAI-compatible API |
| Text analysis | System instruction + fenced untrusted content + deterministic signals as *hints* | 📐 Specified |
| Screenshot analysis | Image → OCR transcription (`extractedText`) + findings; OCR text is re-run through the deterministic engine and tagged `source: ocr` | Client/server image processing 📐 Specified |
| Structured output | Prompted JSON + Zod validate + repair retry alongside native JSON mode | Design decision (ADR-005) |
| Bilingual output | English and Hindi generated in the same call | Hindi quality to be reviewed in evals |
| Fallback | Primary Open-Weight → Fallback Open-Weight → rules-only; report discloses `requestedModel`, `usedModel`, every attempt, and `fellBack` | 📐 Specified |

**Prompt-injection defenses (layered):** per-request nonce fencing of untrusted content · the model has no tools or browsing · only schema-validated fields are consumed · text is rendered as React text nodes only · AI escalation requires verified quotes · injection attempts are surfaced as an indicator · an adversarial evaluation set guards regressions.

---

## 9. Technology stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router), React, TypeScript (`strict`) |
| Styling / UI | Tailwind CSS, shadcn/ui, Lucide React, Motion (restrained) |
| Backend | Next.js Route Handlers, Zod, modular service architecture |
| AI | DigitalOcean GenAI Platform (Open-Weight Models: Llama 3.3 / Llama 3.1) via `openai` client |
| Security | WHATWG `URL`, [`tldts`](https://github.com/remusao/tldts) for registrable-domain analysis, curated heuristics |
| Testing | Vitest (unit + integration), opt-in live-model evals, Playwright (stretch) |
| Hosting | DigitalOcean App Platform via GitHub |

> The scaffold currently in the repo was generated by `create-next-app` and does not yet include the dependencies above. See task T0-02 in [`context/Plan.md`](context/Plan.md).

---

## 10. Getting started

### Prerequisites

- Node.js (developed on v26.0.0; the supported production range will be pinned in `engines`, task T6-01)
- npm
- DigitalOcean GenAI API credentials (`DO_GENAI_API_KEY`, optional `DO_GENAI_BASE_URL`).

### Run the current scaffold

```bash
git clone https://github.com/Aryan-en/Rein-Hacktoberfest-2026.git
cd Rein-Hacktoberfest-2026
npm install
npm run dev        # http://localhost:3000, currently the stock Next.js starter page
```

### Once the MVP lands 📐

```bash
cp .env.example .env.local     # then add DO_GENAI_API_KEY (never commit it)
npm run dev
npm run typecheck && npm run lint && npm test && npm run build
```

Planned scripts

| Script | Purpose |
|---|---|
| `npm run dev` / `build` / `start` | Standard Next.js lifecycle |
| `npm run typecheck` | `tsc --noEmit` under `strict` |
| `npm run lint` | ESLint |
| `npm test` | Unit + integration tests, **offline and deterministic** |
| `npm run test:ai` | Opt-in live-model evals (needs a key) |
| `npx tsx scripts/verify-model.ts` | Verifies DigitalOcean GenAI endpoints, JSON behaviour |

---

## 11. Configuration

All configuration is environment-based and parsed with Zod at startup. Secrets are server-only (never `NEXT_PUBLIC_`).

| Variable | Required | Default | Description |
|---|---|---|---|
| `DO_GENAI_API_KEY` | For AI mode | none | Server-side secret. If absent the app runs rules-only and `/api/health` reports `missing_key` |
| `DO_GENAI_BASE_URL` | No | `https://inference.do.co/v1` | DigitalOcean GenAI serverless inference endpoint |
| `TRUSTLENS_PRIMARY_MODEL` | No | `meta-llama/llama-3.3-70b-instruct` | First open-weight model to try |
| `TRUSTLENS_FALLBACK_MODEL` | No | `meta-llama/llama-3.1-8b-instruct` | Second open-weight model |
| `TRUSTLENS_MODEL_TIMEOUT_MS` | No | `25000` | Per-attempt timeout |
| `TRUSTLENS_RATE_LIMIT_PER_MIN` | No | `10` | Per-client limit |
| `TRUSTLENS_DAILY_CAP` | No | `500` | Global daily inference cap |
| `TRUSTLENS_MAX_TEXT_CHARS` | No | `8000` | Text input limit |
| `TRUSTLENS_MAX_IMAGE_BYTES` | No | `4194304` | Image limit (4 MiB) |
| `LOG_LEVEL` | No | `info` | Log verbosity (never logs user content) |

---

## 12. API reference

### `POST /api/analyze` 📐

```jsonc
// Text
{ "inputType": "text",  "text": "SBI KYC expired! Update within 24 hrs: http://sbi-kyc-verify.example/login" }
// URL
{ "inputType": "url",   "url": "https://paypal.com.secure-login.example/verify" }
// Screenshot (≤ 4 MiB, PNG / JPEG / WebP, magic bytes verified)
{ "inputType": "image", "image": { "mimeType": "image/png", "dataBase64": "…" }, "note": "optional" }
```

Response: an `InvestigationReport` (classification, signals, URL analyses, evidence with provenance, techniques, bilingual explanation, recommendations, limitations, model disclosure, timings). The complete TypeScript contract is in [`context/Architecture.md` §7](context/Architecture.md).

| Status | Code | Meaning |
|---|---|---|
| 200 | | Report returned (also when degraded to `deterministic_only`) |
| 400 | `invalid_request` | Schema failure or empty input |
| 413 | `payload_too_large` | Body, text, or image over limit |
| 415 | `unsupported_media_type` | Wrong content type, disallowed or spoofed image type |
| 422 | `unreadable_image` | Image can't be decoded |
| 429 | `rate_limited` | Per-client or daily cap (`Retry-After` provided) |
| 503 | `service_unavailable` | Server misconfiguration |
| 500 | `internal_error` | Unexpected; generic message plus `requestId` |

A model failure is **not** an HTTP error. It yields a 200 report that says AI analysis was unavailable.

### `GET /api/health` 📐
Returns `{ status, version, ai: "configured" | "missing_key" }`. It does not call DigitalOcean GenAI.

---

## 13. Project structure

**Target layout** (📐 Specified; the scaffold currently has the Next.js default `app/` at the repo root, and the layout will be reconciled in T0-02):

```
├── context/                 # Engineering docs: the source of truth
├── src/
│   ├── app/                 # Routes: landing, /investigate, /api/analyze, /api/health
│   ├── components/          # ui/ layout/ landing/ investigate/ report/ common/
│   ├── hooks/               # useInvestigation, useReportLanguage
│   ├── lib/
│   │   ├── security/        # normalize, URL & text heuristics, rate limit, image validation
│   │   ├── ai/              # provider adapter, prompts, orchestrator, parse, output schema
│   │   ├── analysis/        # pipeline, evidence verification, classification, recommendations
│   │   ├── validation/      # request/response Zod schemas, limits
│   │   ├── config/ report/ demo/ utils/
│   └── types/               # Shared contracts (InvestigationReport, ModelFindings, AiProvider)
├── tests/                   # unit/ integration/ ai/ e2e/
├── evals/  fixtures/        # Synthetic datasets, adversarial cases, results
├── scripts/                 # verify-model, smoke-inference, run-evals, smoke-live
└── .do/app.yaml             # DigitalOcean App Spec
```

---

## 14. Testing & evaluation

| Layer | Scope |
|---|---|
| Unit: security | Normalization, URL parsing, every signal with positive **and benign** cases (e.g. a genuine "never share your OTP" notice must not fire the credential-request signal) |
| Unit: analysis | Exhaustive truth table for classification, evidence verification, JSON repair, orchestrator with a fake provider |
| Integration: API | Status codes, schema conformance, rate limiting, degradation, **no outbound calls on URL input**, no content in logs |
| Live-model evals | Synthetic phishing / benign / adversarial / screenshot datasets; metrics: valid-JSON rate, quote-verification rate, risk in expected range, injection resistance; results committed with model ID and date |
| Security | Secret scans, CSP, oversized/spoofed uploads, injection corpus |
| Accessibility | Keyboard-only journeys, focus visibility, contrast, reduced motion |

All test data is **synthetic**. `npm test` makes **no network calls**.

**Current results:** no tests have been run. See [`context/Progress-tracker.md` §F](context/Progress-tracker.md).

---

## 15. Security model

| Threat | Mitigation |
|---|---|
| Prompt injection (text and image) | Nonce fencing, no model tools, schema-only consumption, verified-quote rule, deterministic floor, adversarial evals |
| SSRF | Submitted URLs are **never fetched or resolved**; only outbound call is the DigitalOcean GenAI API |
| Malicious links | URLs rendered as inert, defanged text, never as anchors |
| Oversized / spoofed uploads | Byte caps before parsing, MIME allowlist, magic-byte check, no SVG, no server-side image decoding |
| Secret exposure | Server-only key, `.env*` ignored, generic error messages |
| Inference abuse | Per-client token bucket, global daily cap, body limits |
| Sensitive data | No persistence, no content logging, UI warns users to redact |
| Hallucination | Quote verification, deterministic recommendations, visible provenance labels |
| Misleading conclusions | Ordinal labels, "indicators not proof", Low ≠ safe, never accuses a named person or organisation |
| XSS | React text nodes only; no `dangerouslySetInnerHTML`; CSP |

Residual risks (per-instance in-memory rate limiting, model misinterpretation, third-party data handling) are listed in [`context/Architecture.md` §8](context/Architecture.md).

To report a vulnerability, open a private security advisory on the GitHub repository (or contact the maintainers); please don't post exploit details publicly.

---

## 16. Privacy

- TrustLens **does not store** submitted content: no database, no server-side files, no analytics.
- To analyse content, the server **sends it to the DigitalOcean GenAI API endpoint**. Treat anything you submit as shared with that provider.
- **Retention and processing terms are governed by DigitalOcean's GenAI Platform policy.**
- **Please redact** OTPs, passwords, card numbers, Aadhaar/PAN and other personal data before submitting.
- Logs contain only request IDs, input type, lengths, signal IDs, risk label, model IDs, latency, and error kinds.
- Fonts are self-hosted; no third-party trackers.

---

## 17. Deployment (DigitalOcean App Platform)

> 📐 Plan only. **Not deployed.** The live URL will be recorded in the tracker and below once verified.

| Item | Plan |
|---|---|
| Source | GitHub `main`, auto-deploy on push |
| Build / run | `npm ci && npm run build` / `npm start` |
| Health check | `GET /api/health` |
| Secrets | `DO_GENAI_API_KEY` as an encrypted env var in the console, never in the repo |
| Instance | Single smallest viable instance (in-memory rate limiter assumes one instance); check current pricing in the console |
| Verification | Scripted live smoke test: health, text, URL, 413, 400, 429 |
| Rollback | Redeploy the previous successful deployment, or `git revert` and push; known-good commit recorded before late deploys |

**Live demo:** _not yet available_

---

## 18. Limitations & honesty statement

TrustLens helps you **reason about** suspicious content. It is not an oracle.

1. It **doesn't open links** or contact senders, so it can't confirm what a site actually contains or who owns it.
2. Indicators are **patterns, not proof** of fraud. False positives and negatives are unavoidable.
3. **AI interpretation can be wrong** and is not independent verification.
4. **Low risk does not mean safe.**
5. Screenshot text is **machine-read** and may contain errors.
6. Brand coverage is a **small curated list** (India-focused plus global majors).
7. Hindi and Hinglish detection is lexicon-based and incomplete.
8. If you have lost money or shared credentials, **contact your bank and the official cybercrime reporting channel immediately**. Reporting channels shown in the app will be checked against official sources before release.

---

## 19. Roadmap

**MVP (hackathon):** text + URL investigation, bilingual reports, evidence linking, model disclosure, rate limiting, deployed demo.
**Stretch:** screenshot investigation, report export, Playwright E2E.
**Later (not committed):** reputation lookups with explicit user consent and clear provenance labels · more regional languages · browser extension · batch triage for helplines · expanded brand and lexicon datasets · community-contributed, reviewed test corpora.

---

## 20. Multi-agent development workflow

The project is built by three AI coding agents coordinated through repository files rather than shared runtime state:

| Agent | Role |
|---|---|
| **Claude** | Architecture, contracts, AI orchestration, risk logic, review, docs |
| **OpenAI Codex** | Next.js, UI, API routes, security utilities, adapter, build and deploy config |
| **Google Gemini** | Model verification, prompts, evals, adversarial testing, demo content |

Rules: exclusive file ownership, contract changes through one editor, mandatory handoff notes, evidence-based completion, and a time-based priority override toward the deadline. See [`context/AGENTS.md`](context/AGENTS.md). Status is only ever as true as the evidence in the tracker.

---

## 21. Documentation map

| Document | Purpose |
|---|---|
| [`context/AGENTS.md`](context/AGENTS.md) | Collaboration protocol, ownership, quality gates, security rules |
| [`context/Architecture.md`](context/Architecture.md) | System design, AI architecture, risk model, API contract, threat model, ADRs |
| [`context/Plan.md`](context/Plan.md) | Phased task plan with acceptance criteria and a time budget |
| [`context/Progress-tracker.md`](context/Progress-tracker.md) | Live status, logs, blockers, test evidence, deploy and submission checklists |
| [`context/UI-registery.md`](context/UI-registery.md) | Design system, page and component registry, UI↔API contracts |

---

## 22. Contributing

Contributions are welcome after the hackathon submission window. Until then, work follows the multi-agent protocol above.

1. Read [`context/AGENTS.md`](context/AGENTS.md) and the architecture doc.
2. Branch from `main` (`<name>/<topic>`), use Conventional Commits (`feat(security): …`).
3. Keep fixtures **synthetic**. Never include real victims' messages, numbers, or accounts.
4. Run `npm run typecheck && npm run lint && npm test && npm run build` before opening a PR.
5. Don't add network calls, telemetry, or dependencies without discussion.

---

## 23. License

**Not yet chosen.** The project is intended to be open source; a license (e.g. MIT or Apache-2.0) will be added by the maintainer before submission. Until a `LICENSE` file exists, all rights are reserved by default.

---

## 24. Acknowledgements

- [DigitalOcean GenAI Platform](https://cloud.digitalocean.com/genai) and open-weight models (Meta Llama 3.3 / 3.1)
- [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Lucide](https://lucide.dev), [Zod](https://zod.dev), [tldts](https://github.com/remusao/tldts), [Vitest](https://vitest.dev)
- Hacktoberfest Hack Day Chandigarh 2026 organisers

<div align="center">

**TrustLens AI**: built to help people pause, check the evidence, and stay protected.

</div>
