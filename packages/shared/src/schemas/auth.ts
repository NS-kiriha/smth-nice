import { z } from "zod";
import { unitSchema } from "./unit.js";

export const usernameSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-zA-Z0-9._-]+$/);

export const passwordSchema = z.string().min(8).max(200);

export const loginRequestSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

export const tenantMeSchema = z.object({
  id: z.string().uuid(),
  username: usernameSchema,
  name: z.string().trim().min(1).max(120),
  unit: unitSchema.nullable(),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type TenantMe = z.infer<typeof tenantMeSchema>;
