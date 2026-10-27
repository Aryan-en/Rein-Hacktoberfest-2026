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

const EnvSchema = z.object({
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
  const apiKey = blank(e.DO_GENAI_API_KEY);
  const fallback = blank(e.TRUSTLENS_FALLBACK_MODEL);
  const level = ["debug", "info", "warn", "error"].includes(e.LOG_LEVEL)
    ? (e.LOG_LEVEL as AppConfig["logLevel"])
    : "info";
  return {
    apiKey,
    baseUrl: e.DO_GENAI_BASE_URL.replace(/\/+$/, ""),
    primaryModel: e.TRUSTLENS_PRIMARY_MODEL,
    fallbackModel: fallback && fallback !== e.TRUSTLENS_PRIMARY_MODEL ? fallback : null,
    visionModel: blank(e.TRUSTLENS_VISION_MODEL),
    visionFallbackModel: blank(e.TRUSTLENS_VISION_FALLBACK_MODEL),
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
