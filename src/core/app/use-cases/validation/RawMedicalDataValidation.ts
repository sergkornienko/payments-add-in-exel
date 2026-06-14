import { z as zod } from "zod";

const RawMedicalDataSchema = zod.object({
  fullName: zod.string().optional(),
  militaryRank: zod.string().optional(),
  dates: zod.string().min(1),
});

export const RawMedicalDataValidator = zod.array(RawMedicalDataSchema);
