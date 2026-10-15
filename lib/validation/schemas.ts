import { z } from "zod";
import { normalizeUsername, parseTikTokInput } from "@/lib/utils/tiktok-url";

const cursor = z
  .string()
  .trim()
  .max(64)
  .regex(/^[A-Za-z0-9_-]*$/, "Cursor tidak valid")
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

export const searchSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("keyword"),
    query: z
      .string()
      .trim()
      .min(2, "Kata kunci minimal 2 karakter")
      .max(100, "Kata kunci maksimal 100 karakter")
      .transform((q) => q.replace(/\s+/g, " ")),
    cursor,
  }),
  z.object({
    mode: z.literal("creator"),
    query: z
      .string()
      .trim()
      .max(32)
      .transform((v, ctx) => {
        const u = normalizeUsername(v);
        if (!u) {
          ctx.addIssue({ code: "custom", message: "Username tidak valid (2–24 karakter: huruf, angka, titik, garis bawah)" });
          return z.NEVER;
        }
        return u;
      }),
    cursor,
  }),
]);

export const videoSchema = z.object({
  input: z
    .string()
    .trim()
    .min(1, "Tautan wajib diisi")
    .max(2048, "Tautan terlalu panjang")
    .refine((v) => parseTikTokInput(v) !== null, "Bukan tautan video TikTok yang valid (tiktok.com/@user/video/…, vt.tiktok.com/…, vm.tiktok.com/…)"),
});

export const extractSchema = z.union([
  z.object({ videoId: z.string().trim().regex(/^\d{8,25}$/, "ID video tidak valid") }),
  z.object({ text: z.string().trim().min(4, "Teks terlalu pendek").max(5000, "Teks maksimal 5000 karakter") }),
]);

export const downloadSchema = z.object({
  id: z.string().regex(/^\d{8,25}$/),
  type: z.enum(["video", "hd", "audio"]),
});

export type SearchInput = z.infer<typeof searchSchema>;

/** First human-readable validation message. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Input tidak valid";
}
