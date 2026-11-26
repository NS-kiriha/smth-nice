import { z } from "zod";

export const unitSchema = z.object({
  id: z.string().uuid(),
  label: z.string().trim().min(1).max(32),
});

export type Unit = z.infer<typeof unitSchema>;
