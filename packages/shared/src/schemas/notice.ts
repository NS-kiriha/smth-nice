import { z } from "zod";

export const noticeSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(10_000),
  publishedAt: z.string().datetime(),
  expiresAt: z.string().datetime().nullable(),
});

export type Notice = z.infer<typeof noticeSchema>;
