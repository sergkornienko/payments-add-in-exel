import { TableSchema } from "../../../../infra/exel/TableSchema";

export const REASONS_MAP_INPUT_SCHEMA: TableSchema = {
  startRow: 1,
  sheetName: "Довідка",
  fields: [
    { name: "id", column: "A" },
    { name: "description", column: "B" },
  ],
};
