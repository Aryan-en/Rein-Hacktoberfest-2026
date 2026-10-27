import { existsSync, readFileSync } from "node:fs";
import { z } from "zod";

/** Minimal .env loader (no dependency). Real environment variables win. */
export function loadDotEnv(path = ".env"): void {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    const key = m[1]!;
    let val = m[2]!;
    if (/^(['"]).*\1$/.test(val)) val = val.slice(1, -1);
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const intFrom = (def: number, min = 1) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === "" ? def : Number(v)))
    .pipe(z.number().int().min(min));

const strFrom = (def: string) =>
  z
    .string()
    .optional()
    .transform((v) => (v === undefined || v.trim() === "" ? def : v.trim()));

/** True for obviously fake values ("dummy-key", "your-key-here", "<paste>") so they never count as real credentials. */
export function isPlaceholderKey(v: string | undefined): boolean {
  const s = (v ?? "").trim();
  return s === "" || /dummy|placeholder|changeme|change-me|your[-_ ]?(api[-_ ]?)?key|replace|example|xxxx|todo|not[-_ ]?(a[-_ ]?)?real|<.*>/i.test(s);
}

const EnvSchema = z.object({
  // "auto" prefers Gemini when a real GEMINI_API_KEY is present, else DigitalOcean, else rules-only.
  AI_PROVIDER: strFrom("auto"),
  GEMINI_API_KEY: z.string().optional(),
  // Google docs list these Gemma 4 model IDs for the Gemini API. Verify with `npm run verify-model`.
  GEMINI_PRIMARY_MODEL: strFrom("gemma-4-31b-it"),
  GEMINI_FALLBACK_MODEL: strFrom("gemma-4-26b-a4b-it"),
  // Gemma 4 is multimodal, but image input on the Gemini API is unverified: leave empty to disable screenshot mode.
  GEMINI_VISION_MODEL: strFrom("gemma-4-31b-it"),
  GEMINI_VISION_FALLBACK_MODEL: z.string().optional(),
  DO_GENAI_API_KEY: z.string().optional(),
  // Verified in DigitalOcean docs: https://inference.do-ai.run/v1 (OpenAI-compatible).
  DO_GENAI_BASE_URL: strFrom("https://inference.do-ai.run/v1"),
  TRUSTLENS_PRIMARY_MODEL: strFrom("meta-llama/llama-3.3-70b-instruct"),
  TRUSTLENS_FALLBACK_MODEL: strFrom("meta-llama/llama-3.1-8b-instruct"),
  // Optional multimodal model for screenshot mode. Empty = screenshot mode disabled.
  TRUSTLENS_VISION_MODEL: z.string().optional(),
  TRUSTLENS_VISION_FALLBACK_MODEL: z.string().optional(),
  TRUSTLENS_JSON_MODE: strFrom("true"),
  TRUSTLENS_MODEL_TIMEOUT_MS: intFrom(25000, 1000),
  TRUSTLENS_RATE_LIMIT_PER_MIN: intFrom(10),
  TRUSTLENS_DAILY_CAP: intFrom(500),
  TRUSTLENS_MAX_TEXT_CHARS: intFrom(8000),
  TRUSTLENS_MAX_IMAGE_BYTES: intFrom(4_194_304),
  TRUSTLENS_PROXY_HOPS: intFrom(1, 0),
  TRUSTLENS_CORS_ORIGINS: strFrom("http://localhost:3000"),
  TRUSTLENS_USER_RATE_LIMIT_PER_MIN: intFrom(30),
  AUTH_SECRET: z.string().optional(),
  AUTH_DATA_FILE: strFrom("data/users.json"),
  SESSION_TTL_DAYS: intFrom(7),
  PORT: intFrom(8080),
  LOG_LEVEL: strFrom("info"),
});

export interface AppConfig {
  /** Which provider is active; null means no real key (rules-only). */
  provider: "gemini" | "digitalocean" | null;
  apiKey: string | null;
  baseUrl: string;
  primaryModel: string;
  fallbackModel: string | null;
  visionModel: string | null;
  visionFallbackModel: string | null;
  jsonMode: boolean;
  modelTimeoutMs: number;
  rateLimitPerMin: number;
  dailyCap: number;
  maxTextChars: number;
  maxImageBytes: number;
  proxyHops: number;
  corsOrigins: string[];
  userRateLimitPerMin: number;
  authSecret: string | null;
  authDataFile: string;
  sessionTtlDays: number;
  port: number;
  logLevel: "debug" | "info" | "warn" | "error";
  aiConfigured: boolean;
}

export function parseConfig(env: Record<string, string | undefined> = process.env): AppConfig {
  const e = EnvSchema.parse(env);
  const blank = (v?: string) => (v && v.trim() ? v.trim() : null);
  const geminiKey = isPlaceholderKey(e.GEMINI_API_KEY) ? null : e.GEMINI_API_KEY!.trim();
  const doKey = isPlaceholderKey(e.DO_GENAI_API_KEY) ? null : e.DO_GENAI_API_KEY!.trim();

  const want = e.AI_PROVIDER.toLowerCase();
  const provider: AppConfig["provider"] =
    want === "gemini" ? (geminiKey ? "gemini" : null)
    : want === "digitalocean" ? (doKey ? "digitalocean" : null)
    : geminiKey ? "gemini" : doKey ? "digitalocean" : null;
  const apiKey = provider === "gemini" ? geminiKey : provider === "digitalocean" ? doKey : null;

  // Model names are provider-specific. With no provider configured, show the Gemma defaults (the default target).
  const useDo = provider === "digitalocean";
  const primary = useDo ? e.TRUSTLENS_PRIMARY_MODEL : e.GEMINI_PRIMARY_MODEL;
  const fallbackRaw = useDo ? blank(e.TRUSTLENS_FALLBACK_MODEL) : blank(e.GEMINI_FALLBACK_MODEL);
  const vision = useDo ? blank(e.TRUSTLENS_VISION_MODEL) : blank(e.GEMINI_VISION_MODEL);
  const visionFallback = useDo ? blank(e.TRUSTLENS_VISION_FALLBACK_MODEL) : blank(e.GEMINI_VISION_FALLBACK_MODEL);
  const level = ["debug", "info", "warn", "error"].includes(e.LOG_LEVEL) ? (e.LOG_LEVEL as AppConfig["logLevel"]) : "info";
  return {
    provider,
    apiKey,
    baseUrl: e.DO_GENAI_BASE_URL.replace(/\/+$/, ""),
    primaryModel: primary,
    fallbackModel: fallbackRaw && fallbackRaw !== primary ? fallbackRaw : null,
    visionModel: vision,
    visionFallbackModel: visionFallback,
    jsonMode: e.TRUSTLENS_JSON_MODE.toLowerCase() !== "false",
    modelTimeoutMs: e.TRUSTLENS_MODEL_TIMEOUT_MS,
    rateLimitPerMin: e.TRUSTLENS_RATE_LIMIT_PER_MIN,
    dailyCap: e.TRUSTLENS_DAILY_CAP,
    maxTextChars: e.TRUSTLENS_MAX_TEXT_CHARS,
    maxImageBytes: e.TRUSTLENS_MAX_IMAGE_BYTES,
    proxyHops: e.TRUSTLENS_PROXY_HOPS,
    corsOrigins: e.TRUSTLENS_CORS_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean),
    userRateLimitPerMin: e.TRUSTLENS_USER_RATE_LIMIT_PER_MIN,
    authSecret: blank(e.AUTH_SECRET),
    authDataFile: e.AUTH_DATA_FILE,
    sessionTtlDays: e.SESSION_TTL_DAYS,
    port: e.PORT,
    logLevel: level,
    aiConfigured: apiKey !== null,
  };
}
