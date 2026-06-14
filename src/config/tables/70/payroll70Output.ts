export const PAYROLL_70_OUTPUT_SCHEMA = {
  startRow: 2,
  sheetName: "70 в новий наказ",
  fields: [
    { name: "militaryRank", column: "A", styleId: "default" },
    { name: "fullName", column: "B", styleId: "default" },
    { name: "taxPayerId", column: "C", styleId: "default" },
    { name: "days", column: "D", styleId: "default" },
    { name: "reason", column: "E", styleId: "dateRange" },
  ],
  predefined: {
    data: [
      { cell: "B1", value: "ПІБ", styleId: "header" },
      { cell: "A1", value: "Військове звання", styleId: "header" },
      { cell: "C1", value: "ІПН", styleId: "header" },
      { cell: "D1", value: "Кількість виплат", styleId: "header" },
      { cell: "E1", value: "Підстава", styleId: "header" },
    ],
    columnStyles: [
      { column: "A", id: "autofit" },
      { column: "B", id: "autofit" },
      { column: "C", id: "autofit" },
      { column: "D", id: "autofit" },
      { column: "E", id: "wide" },
    ],
  },
};
