import { TableSchema } from "../../../infra/exel/TableSchema";

export const INITIAL_70_INPUT_SCHEMA: TableSchema = {
  startRow: 2,
  sheetName: "70",
  fields: [
    { name: "unit", column: "A" },
    { name: "position", column: "B" },
    { name: "militaryRank", column: "C" },
    { name: "fullName", column: "D" },
    { name: "taxPayerId", column: "E" },
    { name: "remainingDaysFromPreviousYear", column: "F" },
    { name: "paymentsOrders", column: "G" },
  ],
};
