import { z } from "zod";

export const rentStatusSchema = z.enum([
  "pending",
  "paid",
  "overdue",
  "waived",
]);

const currencySchema = z.string().regex(/^[A-Z]{3}$/);
const dueDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const rentChargeSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  unitId: z.string().uuid(),
  amountCents: z.number().int().nonnegative(),
  currency: currencySchema,
  dueDate: dueDateSchema,
  periodLabel: z.string().trim().min(1).max(64),
  status: rentStatusSchema,
});

export const rentPaymentSchema = z.object({
  id: z.string().uuid(),
  chargeId: z.string().uuid(),
  tenantId: z.string().uuid(),
  amountCents: z.number().int().positive(),
  currency: currencySchema,
  paidAt: z.string().datetime(),
  note: z.string().max(1_000).nullable(),
  recordedBy: z.string().min(1).max(120),
});

export type RentStatus = z.infer<typeof rentStatusSchema>;
export type RentCharge = z.infer<typeof rentChargeSchema>;
export type RentPayment = z.infer<typeof rentPaymentSchema>;
