import { z } from "zod";
import { ALLOWED_IMAGE_MIME, MAX_NOTE_CHARS, MAX_URL_CHARS } from "./limits";

/** Length limits that depend on runtime config are enforced in the HTTP layer (413). */
export const AnalyzeRequestSchema = z.discriminatedUnion("inputType", [
  z.object({
    inputType: z.literal("text"),
    text: z.string().refine((s) => s.trim().length > 0, "Text must not be empty."),
  }),
  z.object({
    inputType: z.literal("url"),
    url: z
      .string()
      .max(MAX_URL_CHARS)
      .refine((s) => s.trim().length > 0, "URL must not be empty."),
  }),
  z.object({
    inputType: z.literal("image"),
    image: z.object({
      mimeType: z.enum(ALLOWED_IMAGE_MIME),
      dataBase64: z.string().min(8),
    }),
    note: z.string().max(MAX_NOTE_CHARS).optional(),
  }),
]);

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;
