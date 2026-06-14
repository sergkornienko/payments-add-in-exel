import { z as zod } from "zod";

const RawInstructorDataSchema = zod.object({
  fullName: zod.string().min(5),
  militaryRank: zod.string().min(1),
  dates: zod.string().min(1),
});

export const RawInstructorsDataValidator = zod.array(RawInstructorDataSchema);
export const MonthStringSchema = zod
  .string()
  .regex(/^(0[1-9]|1[0-2])\.\d{4}$/, "Неправильний місяць (MM.YYYY)");
