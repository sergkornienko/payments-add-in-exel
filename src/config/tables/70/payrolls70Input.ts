import { TableSchema } from "../../../infra/exel/TableSchema";

export const PAYROLLS_70_INPUT_SCHEMA: TableSchema = {
  startRow: 2,
  sheetName: "70 з відомостей",
  fields: [
    { name: "unit", column: "A" },
    { name: "militaryRank", column: "B" },
    { name: "fullName", column: "C" },
    { name: "dates", column: "D" },
    { name: "taxPayerId", column: "F" },
    { name: "reason", column: "G" },
  ],
};
