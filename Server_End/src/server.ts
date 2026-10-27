import { createServer } from "node:http";
import { createApp } from "./app";
import { loadDotEnv, parseConfig } from "./config/env";
import { createChatClient, DigitalOceanProvider } from "./ai/providers/digitalocean";
import { configureLogger, log } from "./lib/logger";

loadDotEnv();
const config = parseConfig();
configureLogger(config.logLevel);

if (!config.authSecret) log("warn", "AUTH_SECRET not set: using a random per-process secret (sessions end on restart)", { event: "startup" });

const provider = config.apiKey ? new DigitalOceanProvider(createChatClient(config.apiKey, config.baseUrl)) : null;
if (!provider) log("warn", "DO_GENAI_API_KEY not set: running in deterministic_only mode", { event: "startup" });

const server = createServer(createApp({ config, provider }));
server.headersTimeout = 10_000;
server.requestTimeout = 75_000;
server.keepAliveTimeout = 5_000;
server.listen(config.port, () => {
  log("info", "TrustLens server listening", { event: "startup", path: `:${config.port}`, mode: provider ? "ai_assisted" : "deterministic_only", models: [config.primaryModel, config.fallbackModel, config.visionModel].filter(Boolean).join(",") });
});

for (const sig of ["SIGTERM", "SIGINT"] as const) {
  process.on(sig, () => server.close(() => process.exit(0)));
}
