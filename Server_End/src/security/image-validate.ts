import type { AllowedImageMime } from "../validation/limits";

export type ImageCheck =
  | { ok: true; bytes: Uint8Array; mimeType: AllowedImageMime }
  | { ok: false; status: 413 | 415 | 400; reason: string };

const B64 = /^[A-Za-z0-9+/]+={0,2}$/;

/** Length of decoded data for a base64 string without allocating it. */
export function decodedLength(b64: string): number {
  const pad = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  return Math.floor((b64.length * 3) / 4) - pad;
}

export function sniffMime(b: Uint8Array): AllowedImageMime | null {
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return "image/png";
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (
    b.length >= 12 &&
    b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
    b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50
  ) return "image/webp";
  return null;
}

/** Validates size and magic bytes. The declared MIME type is never trusted. */
export function validateImage(dataBase64: string, declared: AllowedImageMime, maxBytes: number): ImageCheck {
  const clean = dataBase64.replace(/\s+/g, "").replace(/^data:[^,]*,/, "");
  if (decodedLength(clean) > maxBytes) return { ok: false, status: 413, reason: "Image is too large." };
  if (clean.length % 4 !== 0 || !B64.test(clean)) return { ok: false, status: 400, reason: "Image data is not valid base64." };
  const bytes = new Uint8Array(Buffer.from(clean, "base64"));
  if (bytes.length === 0) return { ok: false, status: 400, reason: "Image is empty." };
  const sniffed = sniffMime(bytes);
  if (!sniffed) return { ok: false, status: 415, reason: "Unsupported image type. Use PNG, JPEG or WebP." };
  if (sniffed !== declared) return { ok: false, status: 415, reason: "Image content does not match its declared type." };
  return { ok: true, bytes, mimeType: sniffed };
}
