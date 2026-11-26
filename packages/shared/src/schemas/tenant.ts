import { z } from "zod";
import { usernameSchema } from "./auth.js";

export const tenantSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(1).max(120),
  username: usernameSchema,
  unitId: z.string().uuid().nullable(),
  active: z.boolean(),
});

export type Tenant = z.infer<typeof tenantSchema>;
