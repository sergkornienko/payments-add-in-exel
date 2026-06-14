import { z as zod } from "zod";

export const Raw70InitialDataSchema = zod.object({
  fullName: zod.string(),
  militaryRank: zod.string(),
  position: zod.string(),
  unit: zod.string(),
  taxPayerId: zod.union([zod.string(), zod.number()]).optional(),
  remainingDaysFromPreviousYear: zod.number().optional(),
  paymentsOrders: zod.string().optional(),
});

export const Raw70InitialDataArraySchema = zod.array(Raw70InitialDataSchema);

export const Raw70PayrollDataSchema = zod.object({
  fullName: zod.string(),
  militaryRank: zod.string(),
  unit: zod.string(),
  taxPayerId: zod.union([zod.string(), zod.number()]).optional(),
  dates: zod.string(),
  reason: zod.string().optional(),
});

export const Raw70PayrollDataArraySchema = zod.array(Raw70PayrollDataSchema);
