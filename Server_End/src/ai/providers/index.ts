import type { AppConfig } from "../../config/env";
import type { AiProvider } from "../../types/ai";
import { createChatClient, DigitalOceanProvider } from "./digitalocean";
import { createGeminiClient, GeminiProvider } from "./gemini";

/** Builds the configured provider, or null when no real API key is available (rules-only mode). */
export function createProvider(config: AppConfig): AiProvider | null {
  if (!config.apiKey) return null;
  if (config.provider === "gemini") return new GeminiProvider(createGeminiClient(config.apiKey));
  if (config.provider === "digitalocean") return new DigitalOceanProvider(createChatClient(config.apiKey, config.baseUrl));
  return null;
}
