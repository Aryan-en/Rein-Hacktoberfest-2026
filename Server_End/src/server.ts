import { createServer } from "node:http";
import { createApp } from "./app";
import { loadDotEnv, parseConfig } from "./config/env";
import { createProvider } from "./ai/providers";
import { configureLogger, log } from "./lib/logger";

loadDotEnv();
const config = parseConfig();
configureLogger(config.logLevel);

if (!config.authSecret) log("warn", "AUTH_SECRET not set: using a random per-process secret (sessions end on restart)", { event: "startup" });

const provider = createProvider(config);
if (!provider) log("warn", "No real AI API key found (set GEMINI_API_KEY or DO_GENAI_API_KEY): running in deterministic_only mode", { event: "startup" });

const server = createServer(createApp({ config, provider }));
server.headersTimeout = 10_000;
server.requestTimeout = 75_000;
server.keepAliveTimeout = 5_000;
server.listen(config.port, () => {
  log("info", "TrustLens server listening", { event: "startup", path: `:${config.port}`, mode: provider ? "ai_assisted" : "deterministic_only", requestedModel: config.provider ?? "none", models: [config.primaryModel, config.fallbackModel, config.visionModel].filter(Boolean).join(",") });
});

for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
