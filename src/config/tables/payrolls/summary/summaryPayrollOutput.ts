import { TableSchema } from "../../../../infra/exel/TableSchema";

export const getSummaryOutputPayrollSchema = (sheetName: string): TableSchema => {
  return {
    startRow: 2,
    sheetName,
    fields: [
      { name: "unit", column: "A", styleId: "default" },
      { name: "militaryRank", column: "B", styleId: "default" },
      { name: "fullName", column: "C", styleId: "default" },
      { name: "dateRange", column: "D", styleId: "dateRange" },
      { name: "days", column: "E", styleId: "default" },
      { name: "taxPayerId", column: "F", styleId: "default" },
      { name: "reason", column: "G", styleId: "default" },
    ],
    predefined: {
      data: [
        { cell: "A1", value: "Підрозділ", styleId: "header" },
        { cell: "B1", value: "Звання", styleId: "header" },
        { cell: "C1", value: "ПІБ", styleId: "header" },
        { cell: "D1", value: "Період", styleId: "header" },
        { cell: "E1", value: "Днів", styleId: "header" },
        { cell: "F1", value: "ІПН", styleId: "header" },
        { cell: "G1", value: "Рапорт", styleId: "header" },
      ],
      columnStyles: [
        { column: "C", id: "autofit" },
        { column: "D", id: "wide" },
        { column: "E", id: "autofit" },
        { column: "F", id: "autofit" },
        { column: "G", id: "wide" },
      ],
    },
  };
};
