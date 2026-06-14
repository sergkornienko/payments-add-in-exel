import { TableSchema } from "src/infra/exel/TableSchema";

export const getPayrollReportTableSchema = (payload: Partial<TableSchema> = {}): TableSchema => ({
  startRow: 1,
  fields: [
    { name: "militaryRank", column: "A" },
    { name: "fullName", column: "B" },
    { name: "dates", column: "C" },
  ],
  ...payload,
});
