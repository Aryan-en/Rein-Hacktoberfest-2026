import { BASIS_LABEL, CATEGORY_LABEL, RISK_LABEL } from "./labels";
import { pick } from "./i18n";
import type { InvestigationReport, Lang } from "./types";

export function reportToMarkdown(r: InvestigationReport, lang: Lang): string {
  const L = (t: Parameters<typeof pick>[0]) => pick(t, lang);
  const lines: string[] = [];
  lines.push(`# TrustLens AI Investigation Report`, ``);
  lines.push(`- Generated: ${r.generatedAt}`, `- Report ID: ${r.reportId}`);
  lines.push(`- Input type: ${r.input.type}${r.input.textSource === "ocr" ? " (text read from image by AI, may contain errors)" : ""}`);
  lines.push(`- Analysis: ${r.model.mode === "ai_assisted" ? `AI-assisted (model: ${r.model.usedModel}${r.model.fellBack ? `, fallback from ${r.model.requestedModel}` : ""})` : `Rules only, AI unavailable${r.model.degradedReason ? `: ${r.model.degradedReason}` : ""}`}`, ``);
  lines.push(`## Result: ${L(RISK_LABEL[r.classification.risk])}`, ``, L(r.classification.headline), ``);
  lines.push(`Category: ${L(CATEGORY_LABEL[r.classification.category])}`, ``);
  if (r.classification.rationale.length) {
    lines.push(`### Why this rating`);
    for (const x of r.classification.rationale) lines.push(`- ${L(x.text)} _(${L(BASIS_LABEL[x.basis])})_`);
    lines.push(``);
  }
  if (r.explanation) lines.push(`## AI explanation (interpretation, not verification)`, ``, L(r.explanation.summary), ``);
  if (r.input.displayText) lines.push(`## Content analysed`, ``, "```", r.input.displayText, "```", ``);
  if (r.evidence.length) {
    lines.push(`## Evidence`);
    for (const e of r.evidence) {
      lines.push(`- **${L(e.title)}** [${e.provenance}${e.provenance === "heuristic" ? ", indicator not proof" : ""}${e.quote ? `; quote ${e.quoteVerified ? "found" : "NOT found"} in content` : ""}]`);
      if (e.quote) lines.push(`  - Quote: \`${e.quote.replace(/`/g, "'")}\``);
      lines.push(`  - ${L(e.explanation)}`);
    }
    lines.push(``);
  }
  for (const u of r.urls) {
    lines.push(`## Link analysis (not visited)`, `- Link (defanged): \`${defang(u.raw)}\``);
    if (u.parsed) lines.push(`- Registrable domain: ${u.parsed.registrableDomain ?? "(none)"}`, `- Subdomain: ${u.parsed.subdomain ?? "(none)"}`, `- IP host: ${u.parsed.isIp ? "yes" : "no"}`);
    for (const s of u.signals) lines.push(`- ${L(s.title)} (${s.severity})`);
    lines.push(``);
  }
  lines.push(`## Recommended actions`);
  for (const x of r.recommendations) lines.push(`- [${x.priority}] ${L(x.text)}`);
  lines.push(``, `## Limitations`);
  for (const x of [...r.limitations, ...r.uncertainties]) lines.push(`- ${L(x)}`);
  lines.push(``, `---`, `_TrustLens reports are indicators for your own judgement, not proof of fraud._`);
  return lines.join("\n");
}

export const defang = (u: string): string => u.replace(/^http/i, "hxxp").replace(/\./g, "[.]");

export function download(filename: string, mime: string, content: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: `${mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function reportFilename(ext: "md" | "json"): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `trustlens-report-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.${ext}`;
}
