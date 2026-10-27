export const MAX_URL_CHARS = 2048;
export const MAX_NOTE_CHARS = 500;
export const MAX_URLS_ANALYZED = 5;
export const MIN_MEANINGFUL_CHARS = 20;
export const ALLOWED_IMAGE_MIME = ["image/png", "image/jpeg", "image/webp"] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number];
// Hard ceiling for inference across all attempts (see Architecture §4.6).
export const TOTAL_MODEL_BUDGET_MS = 55_000;
