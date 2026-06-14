export const SUMMARY_PAYROLL_OVERLAP_OUTPUT_SCHEMA = {
  startRow: 2,
  sheetName: "Задвоєні періоди",
  fields: [
    { name: "militaryRank", column: "A", styleId: "default" },
    { name: "fullName", column: "B", styleId: "default" },
    { name: "taxPayerId", column: "C", styleId: "default" },
    { name: "dates", column: "D", styleId: "dateRange" },
  ],
  predefined: {
    data: [
      { cell: "B1", value: "ПІБ", styleId: "header" },
      { cell: "A1", value: "Звання", styleId: "header" },
      { cell: "C1", value: "ІПН", styleId: "header" },
      { cell: "D1", value: "Задвоєні дати", styleId: "header" },
    ],
    columnStyles: [
      { column: "A", id: "autofit" },
      { column: "B", id: "autofit" },
      { column: "C", id: "autofit" },
      { column: "D", id: "wide" },
    ],
  },
};
