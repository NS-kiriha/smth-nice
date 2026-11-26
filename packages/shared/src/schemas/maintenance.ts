import { z } from "zod";

export const maintenanceStatusSchema = z.enum([
  "open",
  "in_progress",
  "resolved",
  "closed",
]);

export const maintenanceRequestSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  unitId: z.string().uuid(),
  body: z.string().trim().min(1).max(5_000),
  photoPath: z.string().min(1).nullable(),
  status: maintenanceStatusSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type MaintenanceStatus = z.infer<typeof maintenanceStatusSchema>;
export type MaintenanceRequest = z.infer<typeof maintenanceRequestSchema>;
