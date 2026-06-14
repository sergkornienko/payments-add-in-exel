import { TableSchema } from "../../../../infra/exel/TableSchema";

export const MEDICAL_PAYROLL_INPUT_SCHEMA: TableSchema = {
  startRow: 1,
  fields: [
    { name: "militaryRank", column: "A" },
    { name: "fullName", column: "B" },
    { name: "dates", column: "C" },
  ],
};
