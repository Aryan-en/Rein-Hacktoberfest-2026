// Privacy-by-construction logger: only allow-listed, non-content fields are emitted.
const ALLOWED = new Set([
  "requestId", "method", "path", "status", "inputType", "charCount", "signalIds",
  "risk", "mode", "usedModel", "requestedModel", "models", "latencyMs", "errorKind", "event",
]);
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof LEVELS;

let threshold: Level = "info";
let sink: (line: string) => void = (l) => process.stdout.write(l + "\n");

export function configureLogger(level: Level, out?: (line: string) => void): void {
  threshold = level;
  if (out) sink = out;
}

export function log(level: Level, msg: string, fields: Record<string, unknown> = {}): void {
  if (LEVELS[level] < LEVELS[threshold]) return;
  const safe: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (!ALLOWED.has(k)) continue;
    safe[k] = typeof v === "string" ? v.slice(0, 200) : v;
  }
  sink(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...safe }));
}
