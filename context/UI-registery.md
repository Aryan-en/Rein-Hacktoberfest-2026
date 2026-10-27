# TrustLens AI — UI Registry & Design System

> **Owner:** Claude maintains this file; **Codex** implements everything in it. Contract source of truth for data shapes is `Architecture.md` §7 (`InvestigationReport`).
> **Status:** Specification only — no component below exists until `Progress-tracker.md` says so with evidence.
> **Rule:** No fake metrics, fabricated scans, placeholder statistics, or controls that do nothing. Any number shown on screen must come from the API response or be a documented static limit (e.g., "max 8,000 characters").

---

## A. Design Foundations

### A.1 Direction
Premium security-investigation workbench: calm, precise, spacious. Closer to a developer tool / SOC console than a consumer "scanner". Restrained glass (only on elevated overlays/header), subtle gradients (one hero glow, one accent border sheen), no neon blooms, no decorative charts.

### A.2 Color Tokens (CSS variables in `src/app/globals.css`, mapped in Tailwind theme)

| Token | Hex | Use |
|---|---|---|
| `--bg` | `#080F1D` | App background |
| `--surface` | `#101B2D` | Cards, panels |
| `--surface-2` | `#16243A` | Raised/hover surface, inputs |
| `--surface-3` | `#1C2D47` | Selected / pressed |
| `--border` | `#22324D` | Default 1px borders |
| `--border-strong` | `#2E4263` | Focused/emphasis borders |
| `--text` | `#F8FAFC` | Primary text |
| `--text-muted` | `#94A3B8` | Secondary text |
| `--text-faint` | `#64748B` | Tertiary/placeholder (large text only, see A.9) |
| `--accent` | `#2DD4BF` | Primary action, brand |
| `--accent-fg` | `#042F2E` | Text on accent |
| `--blue` | `#3B82F6` | Secondary accent, info, links-as-text |
| `--risk-high` | `#EF4444` | High risk |
| `--risk-medium` | `#F59E0B` | Medium risk |
| `--risk-low` | `#22C55E` | Low risk |
| `--risk-unknown` | `#94A3B8` | Unknown (neutral slate) |
| `--risk-*-bg` | risk color at 12% alpha | Risk chips/cards backgrounds |
| `--ring` | `#2DD4BF` at 60% | Focus ring |

Gradients: `--grad-hero: radial-gradient(60% 50% at 50% 0%, rgba(45,212,191,.16), transparent 70%)` (landing only); `--grad-border: linear-gradient(135deg, rgba(45,212,191,.45), rgba(59,130,246,.25))` (hero card / primary result card 1px border).
Glass (header, dropdowns): `background: rgba(16,27,45,.72); backdrop-filter: blur(12px); border: 1px solid var(--border)`.

Evidence-provenance colors (never reuse risk colors for these): observed → `--blue`; heuristic → `--risk-medium`-tinted amber outline style; AI interpretation → `--accent` (teal) with sparkle icon; verified-quote tick → neutral white-on-slate (it verifies *presence of quote*, not truth).

### A.3 Typography
Fonts via `next/font`: **Inter** (UI), **JetBrains Mono** (URLs, code, quotes, IDs), **Noto Sans Devanagari** (Hindi; applied when `lang="hi"` content is rendered).

| Token | Size / line-height | Weight | Use |
|---|---|---|---|
| `display` | 56/60 (md+), 38/42 (mobile), tracking -0.02em | 700 | Landing H1 |
| `h1` | 36/40 | 700 | Page titles |
| `h2` | 24/32 | 600 | Section titles |
| `h3` | 18/28 | 600 | Card titles |
| `body` | 16/26 | 400 | Default |
| `body-sm` | 14/22 | 400 | Secondary, table cells |
| `caption` | 12/16, uppercase tracking .06em | 500 | Labels, eyebrow |
| `mono` | 13/20 | 400 | URLs, quotes |

Hindi content: line-height +0.1, no letter-spacing, min 16px.

### A.4 Spacing
4-pt base: `1=4 2=8 3=12 4=16 5=20 6=24 8=32 10=40 12=48 16=64 24=96`. Section vertical rhythm: 96 (landing desktop) / 64 (mobile); card padding 24 (md+) / 16 (mobile); gap between result cards 16–24.

### A.5 Radii
`sm 6` (chips, inputs inner) · `md 10` (buttons, inputs) · `lg 14` (cards) · `xl 20` (hero card, modals) · `full` (pills, avatar).

### A.6 Shadows
`shadow-card: 0 1px 0 rgba(255,255,255,.03) inset, 0 8px 24px -12px rgba(0,0,0,.6)` · `shadow-pop: 0 16px 48px -16px rgba(0,0,0,.7)` · risk glow (High/Medium/Low result card only): `0 0 0 1px <risk>/35%, 0 12px 40px -20px <risk>/45%`.

### A.7 Breakpoints & Grid
Tailwind defaults: `sm 640`, `md 768`, `lg 1024`, `xl 1280`, `2xl 1536`. Container max-width 1200 (landing) / 1280 (workspace), side padding 16 / 24 / 32 at base / md / lg. 12-column grid ≥ lg with 24 gutter; stacked single column < md. Investigation page: `lg` → two panes (input 5 cols | report 7 cols, sticky input pane); `< lg` → input then report stacked, report scrolls into view on completion.

### A.8 Motion Principles
Use **Motion** (`motion/react`) only for: page/section fade-up (y 8→0, 240ms, ease-out), staggered evidence cards (40ms stagger, max 8), progress step transitions, risk badge entrance (scale .96→1, 200ms). CSS transitions (150ms) for hover/focus. Rules: motion conveys state change, never decorates; all animations respect `prefers-reduced-motion: reduce` (disable transforms, keep opacity ≤ 100ms); no looping animations except an indeterminate progress indicator; never delay content visibility > 300ms.

### A.9 Accessibility Requirements (global)
- WCAG 2.2 AA: text contrast ≥ 4.5:1 (`--text-muted` on `--surface` passes; `--text-faint` only ≥ 18px or non-essential).
- Risk is **never** conveyed by color alone: icon + text label (`High risk`, etc.) always present.
- Visible focus: 2px `--ring` outline + 2px offset on every interactive element; never `outline: none` without replacement.
- Full keyboard operation; logical tab order; skip-to-content link; tabs follow WAI-ARIA tabs pattern (arrow keys).
- Live regions: progress and completion announced via `aria-live="polite"`; errors via `role="alert"`.
- Hit targets ≥ 44×44 on touch.
- Language: wrapper elements for Hindi content carry `lang="hi"`.
- Images: screenshot preview has meaningful `alt` ("Uploaded screenshot preview").
- Respect `prefers-reduced-motion`, `prefers-contrast` (increase border contrast).

### A.10 Dark-mode Behavior
Dark-only product (`<html class="dark" style="color-scheme: dark">`). No light theme in MVP and **no theme toggle** (a non-functional toggle is forbidden). Print/export stylesheet renders a light, ink-friendly version of the report (`@media print`).

### A.11 Focus/State Conventions
Hover: surface → `--surface-2`. Active: `--surface-3`, translateY(0.5px). Disabled: 45% opacity, `cursor-not-allowed`, `aria-disabled`. Loading buttons: spinner + label stays (e.g., "Analyzing…"), button `aria-busy`.

---

## B. Page Registry

Routes (Next.js App Router): `/` (landing), `/investigate` (workspace + results + URL forensics + screenshot, all in one page). Separate pages for URL forensics/screenshot/export are **not** built; they are views inside `/investigate`.

### B.1 Landing page — `/` — **MVP (P0)**
- **Purpose:** Explain the product honestly; get the user into the workspace in one click.
- **Layout:** `AppShell(variant="marketing")` → `HeroSection` → "How an investigation works" 4-step strip (static, factual: Input → Deterministic checks → DigitalOcean Open-Weight AI analysis → Verified report) → "What you get" 3 cards (Evidence-backed, URL forensics, English + Hindi) → "Honest by design" panel (limitations: no link visiting, indicators ≠ proof) → `DemoScenarioSelector` (compact; links into `/investigate?demo=<id>`) → Footer (open-source link, privacy note, DigitalOcean GenAI attribution).
- **Components:** AppShell, TopNavigation, HeroSection, DemoScenarioSelector (compact), Footer.
- **Responsive:** hero stacks; step strip becomes vertical list < md.
- **States:** static; no loading. Hero CTA = `Link` to `/investigate`.
- **Forbidden:** user counts, "scans today", fake testimonials, fake threat map.

### B.2 Investigation workspace — `/investigate` — **MVP (P0)**
- **Purpose:** Capture suspicious content and run the investigation.
- **Layout (lg+):** left sticky pane = `InvestigationInput` (InputModeTabs: Message | URL | Screenshot + AnalyzeButton + DemoScenarioSelector + privacy note); right pane = report area. Empty right pane shows **Empty state** (what you can analyze + 3 demo chips). Sidebar is hidden in MVP (see C: `Sidebar` is P2, rendered only when ≥1 real item exists, i.e., session history held in memory).
- **States:** `idle` · `validating` (inline field errors) · `submitting/analyzing` (`InvestigationProgress`) · `success` (report) · `error` (typed error panel with retry) · `rate_limited` (countdown from `retryAfterSeconds`).
- **Responsive:** < lg stacked; on success, scroll report heading into view and move focus to it.
- **Deep links:** `?demo=<scenarioId>` pre-fills input (does not auto-submit); `?mode=url|image|text`.

### B.3 Investigation results — rendered inside `/investigate` right pane — **MVP (P0)**
Order (top → bottom):
1. `ModelDisclosureBar` (only visible when `fellBack` or `deterministic_only`; otherwise a compact "Analyzed with {usedModel}" caption — real value from response).
2. `RiskClassification` (hero result card: risk label, headline, category badge, rationale list).
3. `AIExplanationPanel` (summary + manipulation techniques) with `LanguageSwitcher` in its header (the switch affects all localized strings on the page).
4. `HighlightedMessage` (original text with evidence spans highlighted) — text/OCR modes.
5. Evidence list: `EvidenceCard`s grouped by provenance (Observed / Heuristic / AI interpretation).
6. `URLForensicsPanel` (if `urls.length > 0`).
7. `SafetyRecommendations`.
8. `UncertaintyNotice` (limitations + uncertainties).
9. `ExportReportButton` bar (sticky at bottom on mobile).
- **Interactions:** hover/click a highlight ↔ scroll-and-flash its evidence card (bidirectional, via shared `activeEvidenceId` state). Evidence cards collapsible; first 3 expanded.
- **Empty sub-states:** no evidence → "No specific evidence items were identified" (not hidden); no URLs → URL panel omitted.

### B.4 URL forensics view — **inside results (P0 for panel; standalone view P2)**
Rendered by `URLForensicsPanel` per `UrlAnalysis`: defanged URL (mono, copy button), host breakdown diagram (subdomain · **registrable domain** · public suffix, color-segmented with labels), facts table (protocol, port, userinfo, IP host, punycode decode, label count), triggered signals list (severity chip + explanation). Footer line: "TrustLens did not visit this link." For URL input mode with zero signals: "No structural red flags found in this URL. This does not confirm the site is safe."
- Responsive: facts table becomes definition list < md; breakdown wraps.

### B.5 Screenshot investigation view — **P1 (within workspace)**
Input: `ScreenshotUploader` (drag-drop + click + paste from clipboard; PNG/JPEG/WebP ≤ 4 MB; preview with remove). Results add: left/right split on lg — image preview with "Extracted text (machine-read, may contain errors)" panel; `HighlightedMessage` runs on the extracted text; evidence items flagged `source: ocr` show an "OCR" chip. Bounding-box overlays are **not** supported (model does not return reliable coordinates) — do not draw them.

### B.6 Report export interface — **P1**
`ExportReportButton` → menu: Download JSON, Download Markdown, Print / Save as PDF (uses `window.print()` with print stylesheet), Copy summary. All client-side from the in-memory `InvestigationReport`; export includes current report language selection plus both languages in JSON. Exports include model disclosure and limitations. Filename: `trustlens-report-<yyyymmdd-hhmm>.md|json`. No server round trip. Excluded from exports: raw uploaded image bytes.

### B.7 Error, loading, empty states — **MVP (P0)**

| State | Treatment |
|---|---|
| Loading (analyzing) | `InvestigationProgress`: steps reflect **real** pipeline phases only as they are known client-side: "Sending", "Analyzing" (single indeterminate step while awaiting response), "Building report". The server does not stream in MVP, so intermediate phases are **not** faked; show elapsed seconds counter. |
| Validation error | Inline under the field, `role="alert"`, preserves input |
| 429 | Panel with live countdown from `retryAfterSeconds`; button disabled until elapsed |
| 413/415 | Specific message (file too large / unsupported type) with limits |
| 5xx / network | "Something went wrong on our side" + requestId (copyable) + Retry |
| Degraded (deterministic_only) | Not an error: report renders with amber `ModelDisclosureBar` |
| Empty workspace | Illustrated (icon only) empty state with 3 real demo scenario chips |
| 404 / route error | `not-found.tsx`, `error.tsx` using `ErrorBoundary` styling |

---

## C. Component Registry

Conventions: files are `.tsx` under `src/components/…`; all props interfaces exported; components are **Server Components by default** and marked `"use client"` only where noted (**C** = client). `ReportLang = "en" | "hi"`. `L = LocalizedText` from `src/types`. Shared dependency on `cn()` from `src/lib/utils`, Lucide icons, shadcn primitives (installed into `src/components/ui`). All a11y notes are in addition to A.9.

### C.1 Layout

**AppShell** — `components/layout/AppShell.tsx` (server)
- Purpose: page frame with skip link, header, main landmark, footer, background gradient.
- Props: `{ variant?: "marketing" | "workspace"; children: ReactNode }`
- Variants: marketing (centered container, hero glow) / workspace (wider container, no glow).
- States: static. A11y: `<a href="#main">Skip to content</a>`, `<main id="main" tabIndex={-1}>`. Responsive: container paddings per A.7. Deps: TopNavigation, Footer.

**TopNavigation** — `components/layout/TopNavigation.tsx` (server)
- Purpose: brand + links (Investigate, GitHub repo) + CTA. No fake menu items.
- Props: `{ variant?: "marketing" | "workspace" }`. Glass header, sticky, 64px. Mobile: logo + "Investigate" button + sheet menu (C) with GitHub link. A11y: `<nav aria-label="Primary">`, current page `aria-current="page"`. Deps: shadcn `Sheet`, `Button`.

**Sidebar** — `components/layout/Sidebar.tsx` (**C**) — **P2**
- Purpose: in-session history of reports (memory only, lost on refresh — stated in UI). Render only if `items.length > 0`.
- Props: `{ items: Array<{ id: string; risk: RiskLevel; label: string; at: string }>; activeId?: string; onSelect(id: string): void }`. A11y: `<nav aria-label="Session investigations">`, list with `aria-current`. Responsive: drawer < xl. Deps: RiskDot.

**Footer** — `components/layout/Footer.tsx` (server). Static: repo link, "Open source", "Powered by DigitalOcean GenAI & Open-Weight AI (Llama 3.3 / 3.1)", privacy line ("Submitted content is sent to DigitalOcean GenAI inference endpoints for analysis; TrustLens does not store it."), report-fraud pointer text (verified copy). Props: none.

### C.2 Landing

**HeroSection** — `components/landing/HeroSection.tsx` (server)
- Purpose: H1 "Understand the Threat. Verify the Evidence. Stay Protected." subcopy (one honest sentence), primary CTA "Start an investigation" → `/investigate`, secondary CTA "See a demo" → `/investigate?demo=bank-kyc-phish`. Right side: a **static, truthfully-labelled illustrative sample card** captioned "Sample report (synthetic example)" built from a fixed demo report fixture — must be labelled; no animation implying live scanning.
- Props: `{}`. A11y: single `h1`. Responsive: stack < lg, sample card below.

### C.3 Investigation Input

**InvestigationInput** — `components/investigate/InvestigationInput.tsx` (**C**)
- Purpose: owns local draft state for all three modes and submits.
- Props: `{ onSubmit(req: AnalyzeRequest): void; status: InvestigationStatus; initial?: Partial<DraftState>; disabled?: boolean }`
- Local state: `mode`, `text`, `url`, `image`, `note`, field errors. Client-side pre-validation mirrors server limits (same constants from `src/lib/validation/limits.ts`). Never mutates server data.
- States: idle, invalid, submitting (all inputs `readOnly`), rate_limited (disabled).
- A11y: `<form>` with labelled fields; error summary linked via `aria-describedby`. Deps: InputModeTabs, URLInput, ScreenshotUploader, AnalyzeButton, DemoScenarioSelector.

**InputModeTabs** — `components/investigate/InputModeTabs.tsx` (**C**)
- Props: `{ value: "text"|"url"|"image"; onChange(v): void; disabled?: boolean }`. Labels: "Message", "URL", "Screenshot" (icons: MessageSquareText, Link2, ImageUp). Variant: segmented control. A11y: `role=tablist`, roving tabindex, arrow keys. Deps: shadcn `Tabs`.

**MessageInput** (part of InvestigationInput file or sibling) — `components/investigate/MessageInput.tsx` (**C**)
- Props: `{ value: string; onChange(v): void; error?: string; disabled?: boolean }`. Textarea min 8 rows, live counter `n / 8,000` (real), warning color at 90%, paste-friendly. Placeholder: "Paste the suspicious SMS, WhatsApp message, or email here…". Hint: "Remove OTPs, passwords and personal details first." A11y: `aria-describedby` counter+hint.

**URLInput** — `components/investigate/URLInput.tsx` (**C**)
- Props: `{ value: string; onChange(v): void; error?: string; disabled?: boolean }`. Mono input, `inputMode="url"`, `autocomplete="off"`, `spellcheck=false`. Helper: "We analyze the link's structure only. We never open it." Accepts without scheme. Max 2,048.

**ScreenshotUploader** — `components/investigate/ScreenshotUploader.tsx` (**C**) — P1
- Props: `{ file: File | null; onChange(file: File | null): void; error?: string; disabled?: boolean }`
- Behavior: click/drag-drop/paste; validate type (png/jpeg/webp) + size ≤ 4 MB client-side; show preview via `URL.createObjectURL` (revoked on unmount/change), filename + size, Remove button. States: empty, dragover, selected, error, disabled. A11y: dropzone is a `button`-role label wrapping a visually-hidden `<input type=file accept="image/png,image/jpeg,image/webp">`; announce selection via live region. Optional `note` textarea (≤500) "Anything we should know?".

**AnalyzeButton** — `components/investigate/AnalyzeButton.tsx` (**C**)
- Props: `{ status: InvestigationStatus; disabledReason?: string; cooldownSeconds?: number }` (submits parent form). Label by status: "Analyze" / "Analyzing…" / "Try again in {n}s". Primary teal. Keyboard: Enter in URL field submits; Ctrl/Cmd+Enter submits from textarea (hint shown).

**DemoScenarioSelector** — `components/investigate/DemoScenarioSelector.tsx` (**C**)
- Purpose: load **synthetic** sample inputs (from `lib/demo/scenarios.ts`, authored by Gemini) into the form. It fills inputs; it does **not** fabricate results — analysis runs the real pipeline.
- Props: `{ scenarios: DemoScenario[]; onSelect(s: DemoScenario): void; variant?: "chips" | "compact" }`
- `DemoScenario = { id: string; title: L; inputType: "text"|"url"|"image"; text?: string; url?: string; imageAsset?: string; blurb: L }`. Label shown: "Synthetic example". A11y: buttons with clear names. Image scenarios load a bundled image from `public/demo/`.

### C.4 Progress & State

**InvestigationProgress** — `components/investigate/InvestigationProgress.tsx` (**C**)
- Props: `{ status: "submitting" | "analyzing"; elapsedMs: number; inputType: InputType }`
- Renders truthful phases per B.7 + elapsed seconds; indeterminate bar (reduced-motion → static). `role="status" aria-live="polite"`. If elapsed > 20s show "Still working — the AI model is taking longer than usual."

**ErrorBoundary** — `components/common/ErrorBoundary.tsx` (**C**, class component)
- Props: `{ children: ReactNode; fallback?: (err: Error, reset: () => void) => ReactNode }`. Default fallback: card with message "This part of the page failed to display", Retry button; no stack traces shown. Wraps the report area so a render bug never blanks the app.

**ErrorPanel** — `components/investigate/ErrorPanel.tsx` (server-safe, receives props)
- Props: `{ error: ApiError["error"] | { code: "network"; message: string }; onRetry?(): void; cooldownSeconds?: number }`. `role="alert"`. Shows requestId with copy.

**EmptyState** — `components/investigate/EmptyState.tsx` — Props `{ onPickDemo(s: DemoScenario): void; scenarios: DemoScenario[] }`.

### C.5 Report

All report components are **presentational**: they receive slices of `InvestigationReport` + `lang` + callbacks; no fetching, no derived risk logic (risk is computed server-side).

**RiskClassification** — `components/report/RiskClassification.tsx`
- Props: `{ classification: InvestigationReport["classification"]; lang: ReportLang }`
- Variants: `high | medium | low | unknown` → border/glow color, icon (ShieldAlert / AlertTriangle / ShieldCheck / HelpCircle), label text: "High risk", "Medium risk", "Low risk", "Unknown". Contains: label, `headline[lang]`, `ThreatCategoryBadge`, collapsible "Why this rating" list from `rationale` (basis chip: "From rules", "AI + verified quote", "AI, unverified (capped)", "Insufficient input", "Model disagreed"). **Low** variant always shows sub-caption "No strong scam indicators found. This is not a guarantee of safety." **Unknown** sub-caption "Not enough information to classify."
- A11y: `role="region" aria-label="Risk classification"`; label text not color-only. No percentage, gauge, or score is rendered.

**ThreatCategoryBadge** — `components/report/ThreatCategoryBadge.tsx`
- Props: `{ category: ThreatCategory; lang: ReportLang }` — static map `category → {en, hi, icon}` in `components/report/category-labels.ts`.

**ModelDisclosureBar** — `components/report/ModelDisclosureBar.tsx`
- Props: `{ model: ModelDisclosure; lang: ReportLang }`. Variants: `normal` (muted caption "Analyzed with {usedModel}"), `fallback` (blue info bar: "Primary model unavailable; analyzed with {usedModel}"), `degraded` (amber bar: "AI analysis unavailable — showing rule-based findings only", with `degradedReason`). Expandable attempts list (model, outcome, latencyMs — real values).

**AIExplanationPanel** — `components/report/AIExplanationPanel.tsx` (**C** only for local expand state)
- Props: `{ explanation: InvestigationReport["explanation"]; techniques: InvestigationReport["manipulationTechniques"]; lang: ReportLang; onLangChange(l: ReportLang): void }`
- Renders summary, technique chips with expandable explanations; badge "AI interpretation" (provenance). When `explanation === null`: shows "AI analysis unavailable for this report." Header hosts `LanguageSwitcher`. Missing `hi` string → fall back to `en` with "Hindi unavailable" caption. Hindi wrapper has `lang="hi"`.

**LanguageSwitcher** — `components/common/LanguageSwitcher.tsx` (**C**)
- Props: `{ value: ReportLang; onChange(l: ReportLang): void }`. Segmented "English | हिन्दी". Persists to `localStorage` key `trustlens.lang` via `useReportLanguage` hook (read in effect to avoid hydration mismatch). A11y: `role="radiogroup"` with labels; announces change via live region "Language set to Hindi".

**HighlightedMessage** — `components/report/HighlightedMessage.tsx` (**C**)
- Props: `{ text: string; evidence: EvidenceItem[]; activeEvidenceId: string | null; onActivate(id: string | null): void; sourceLabel: "Your message" | "Extracted text (machine-read)" }`
- Splits `text` by non-overlapping spans (overlaps merged; algorithm in `lib/report/spans.ts`), renders `<mark data-evidence-id>` with color by severity (strong → risk-high tint, weak → amber tint, info → blue tint) **plus** underline style differences (not color alone). Only items with `span !== null` are highlighted. Whitespace preserved (`whitespace-pre-wrap`), mono optional toggle. Keyboard: marks are focusable buttons; Enter focuses evidence card. Text rendered as React text nodes only.

**EvidenceCard** — `components/report/EvidenceCard.tsx` (**C** for collapse)
- Props: `{ item: EvidenceItem; lang: ReportLang; active: boolean; onHover(id | null): void; defaultOpen?: boolean }`
- Anatomy: severity icon + title; provenance chip (Observed / Heuristic indicator / AI interpretation); quote block (mono) with "Quote found in your content ✓" or "Quote not found verbatim ✗ — treated as unverified"; explanation; `OCR` chip if `source==="ocr"`. Footnote on heuristic: "Indicator, not proof." States: collapsed/expanded, active-highlight (flash 600ms, respects reduced motion). A11y: disclosure pattern (`aria-expanded`).

**URLForensicsPanel** — `components/report/URLForensicsPanel.tsx`
- Props: `{ urls: UrlAnalysis[]; lang: ReportLang }`. One `UrlForensicsCard` per URL (max 5; shows "+N more not analyzed" if applicable). Sub-parts: `DefangedUrl` (`hxxps://example[.]com/…`, copy raw/defanged buttons; **no anchors**), `HostBreakdown` (segmented bar: subdomain | **registrable domain** | suffix, labelled), facts `<dl>`, signals list. Unparseable URL → card with observation and no breakdown. Always footer: "TrustLens did not visit this link."

**SafetyRecommendations** — `components/report/SafetyRecommendations.tsx`
- Props: `{ items: InvestigationReport["recommendations"]; lang: ReportLang }`. Grouped by priority `now` ("Do this now") / `soon` / `info`; checklist-style (non-interactive list; checkboxes **not** used since they'd imply tracked state). Icons only decorative.

**UncertaintyNotice** — `components/report/UncertaintyNotice.tsx`
- Props: `{ limitations: L[]; uncertainties: L[]; lang: ReportLang; emphasis?: boolean }`. Info-styled (blue), always visible (not collapsed) — `emphasis` true for Unknown/Low. Title "What this investigation can't tell you".

**ExportReportButton** — `components/report/ExportReportButton.tsx` (**C**) — P1
- Props: `{ report: InvestigationReport; lang: ReportLang }`. Dropdown menu: Download JSON / Download Markdown / Print or save as PDF / Copy summary. Uses `lib/report/{json,markdown}.ts` (pure functions, unit-tested) and `Blob` download. Copy summary shows toast "Copied". Disabled if no report. A11y: menu button pattern; toast via live region.

**RiskDot** (P2 helper) — `components/report/RiskDot.tsx` `{ risk: RiskLevel }` icon+sr-only label.

### C.6 Hooks / client modules (not visual, but contract-bearing)

| Module | Path | Contract |
|---|---|---|
| `useInvestigation` | `src/hooks/useInvestigation.ts` | `() => { status: InvestigationStatus; report: InvestigationReport \| null; error: UiError \| null; elapsedMs: number; cooldownSeconds: number; submit(req: AnalyzeRequest): Promise<void>; reset(): void }`. Uses `AbortController`; one in-flight request; 90s client timeout. |
| `useReportLanguage` | `src/hooks/useReportLanguage.ts` | `() => [ReportLang, (l: ReportLang) => void]` persisted in localStorage. |
| `api-client` | `src/lib/api-client.ts` | `analyze(req, signal): Promise<InvestigationReport>`; throws typed `ApiClientError` mapping `ApiError` or network failure. |

`InvestigationStatus = "idle" | "submitting" | "analyzing" | "success" | "error"`.

---

## D. User Journeys

### D.1 Paste a suspicious message
1. Land on `/investigate` (or via hero CTA). Message tab active. 2. Paste text; counter updates. 3. Press Analyze (or Ctrl/Cmd+Enter). 4. Button → "Analyzing…", inputs read-only, `InvestigationProgress` visible with elapsed timer. 5. On 200: progress replaced by report; focus moves to report heading; page scrolls on mobile. 6. If risk is High/Medium, `SafetyRecommendations` "Do this now" is visible without scrolling past the evidence on desktop (anchor link "Jump to what to do"). **Error branches:** empty → inline error; >8,000 → counter red + blocked; 429 → countdown; network → retry preserving input.

### D.2 Analyze a URL
URL tab → paste (scheme optional) → Analyze → report with `URLForensicsPanel` first-class (for URL mode the panel is placed directly under `RiskClassification`). Message: "We analyzed the link's structure only." Invalid URL (unparseable) → still returns report with Unknown/medium per engine; UI shows the observation.

### D.3 Upload a screenshot (P1)
Screenshot tab → drop/click/paste image → preview → optional note → Analyze → progress (screenshot analyses may take longer; copy reflects) → report with extracted-text panel, OCR chips, caution banner "Text was read from the image by AI and may contain errors." Invalid type/size → inline error before upload.

### D.4 Review evidence
Read risk + rationale → scan highlighted message → click highlight → matching `EvidenceCard` scrolls into view and flashes → expand card to see quote, provenance, verification status → expand "Why this rating" to see which basis each reason came from.

### D.5 Switch explanation language
In `AIExplanationPanel` header toggle English ↔ हिन्दी → all `L` strings across risk headline, rationale, evidence explanations, techniques, recommendations, limitations switch instantly (no refetch, both languages are in the response) → choice persists via localStorage → live region announces change.

### D.6 Export a report (P1)
Click Export → choose Markdown/JSON/Print/Copy → file download or print dialog (print stylesheet: light theme, hides inputs/nav) → toast confirms. Export contents reflect the report exactly, include model disclosure + limitations, exclude raw image.

---

## E. UI Implementation Contracts

### E.1 Data ownership

| Layer | Holds | Notes |
|---|---|---|
| Server (`/api/analyze`) | All analysis, risk, evidence, URL parsing, recommendations | UI never recomputes risk or evidence |
| `useInvestigation` (client state) | `status`, `report`, `error`, timers | Single source for the page; `InvestigatePage` ("use client" container) passes slices down |
| `InvestigationInput` (local) | Draft fields, client validation errors | Cleared only by user action |
| `InvestigatePage` (local) | `activeEvidenceId`, `lang` (via hook) | Shared by HighlightedMessage ↔ EvidenceCard |
| localStorage | `trustlens.lang` only | No content stored client-side |

### E.2 API → UI mapping

| Response field | Rendered by | Mapping rule |
|---|---|---|
| `classification.risk` | RiskClassification | variant + label text + icon; no numeric rendering |
| `classification.headline[lang]` | RiskClassification | h2 text |
| `classification.category` | ThreatCategoryBadge | label map |
| `classification.rationale[]` | RiskClassification "Why this rating" | one row each with basis chip |
| `model.*` | ModelDisclosureBar | variant: `deterministic_only`→degraded, `fellBack`→fallback, else normal |
| `explanation.summary[lang]`, `manipulationTechniques[]` | AIExplanationPanel | `null` explanation → unavailable notice |
| `input.displayText`, `evidence[].span` | HighlightedMessage | only evidence with `span` highlighted; mode `url` → component not rendered |
| `evidence[]` | EvidenceCard list | grouped by `provenance`, sorted strong→weak→info |
| `evidence[].quoteVerified` | EvidenceCard | ✓/✗ line (see C.5) |
| `urls[]` | URLForensicsPanel | one card each |
| `signals[]` | Used in URL cards (url_* ids) and merged into `evidence` by the server; the UI does not render `signals` separately in MVP |
| `recommendations[]` | SafetyRecommendations | group by priority |
| `limitations[]`, `uncertainties[]` | UncertaintyNotice | always rendered |
| `timings.totalMs` | Footer of report (caption "Completed in {n}s") | real value |
| `reportId`, `generatedAt` | Export header, caption | real values |

### E.3 Prohibited
Fabricated progress steps, fake counters, "AI confidence %", gauges, threat maps, decorative charts, buttons without handlers, links created from analyzed URLs, `dangerouslySetInnerHTML`, client-side re-translation, client-side risk computation.

### E.4 Shared constants
`src/lib/validation/limits.ts` (owned by Claude) exports `MAX_TEXT_CHARS=8000`, `MAX_URL_CHARS=2048`, `MAX_IMAGE_BYTES=4194304`, `MAX_NOTE_CHARS=500`, `ALLOWED_IMAGE_MIME`. UI imports these; never hardcodes.

### E.5 Component → Task mapping
See `Plan.md` Phase 3 (T3-xx) and Phase 4 (T4-04). Priority legend: **P0** = HeroSection, AppShell, TopNavigation, Footer, InvestigationInput (+ Message/URL inputs, tabs), AnalyzeButton, DemoScenarioSelector, InvestigationProgress, ErrorBoundary, ErrorPanel, EmptyState, RiskClassification, ThreatCategoryBadge, ModelDisclosureBar, AIExplanationPanel, LanguageSwitcher, HighlightedMessage, EvidenceCard, URLForensicsPanel, SafetyRecommendations, UncertaintyNotice. **P1** = ScreenshotUploader, ExportReportButton. **P2** = Sidebar, RiskDot.

### E.6 Change control
Contract changes (props, mapping) → edit this file in the same commit as the code change, add a Decision line in `Progress-tracker.md` §E, and mention in the handoff. Codex may extend visual details but must not change data mappings without Claude's review.
