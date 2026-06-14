import { TableSchema } from "../../../infra/exel/TableSchema";

export const getInitial70OutputSchema = (options: Partial<TableSchema> = {}): TableSchema => {
  return {
    startRow: 2,
    sheetName: "70 нові",
    fields: [
      { name: "unit", column: "A" },
      { name: "position", column: "B" },
      { name: "militaryRank", column: "C" },
      { name: "fullName", column: "D" },
      { name: "taxPayerId", column: "E" },
      { name: "remainingDaysFromPreviousYear", column: "F" },
      { name: "paymentsOrders", column: "G" },
    ],
    predefined: {
      data: [
        { cell: "A1", value: "Підрозділ", styleId: "header" },
        { cell: "B1", value: "Посада", styleId: "header" },
        { cell: "C1", value: "Звання", styleId: "header" },
        { cell: "D1", value: "ПІБ", styleId: "header" },
        { cell: "E1", value: "ІПН", styleId: "header" },
        { cell: "F1", value: "Кількість днів", styleId: "header" },
        { cell: "G1", value: "Накази", styleId: "header" },
      ],
      columnStyles: [
        { column: "C", id: "autofit" },
        { column: "D", id: "wide" },
        { column: "E", id: "autofit" },
        { column: "F", id: "autofit" },
        { column: "G", id: "wide" },
      ],
    },
    ...options,
  };
};
