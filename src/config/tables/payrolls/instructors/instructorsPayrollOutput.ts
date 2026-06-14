import { TableSchema } from "../../../../infra/exel/TableSchema";
import { normalizeDay, getExcelColumn } from "../../helpers";

export const getInstructorsOutputSchema = (monthStr: string): TableSchema => {
  const schema: TableSchema = {
    startRow: 2,
    sheetName: "Відомість інструкторів",
    fields: [
      { name: "militaryRank", column: "A", styleId: "default" },
      { name: "fullName", column: "B", styleId: "default" },
      { name: "dateRange", column: "C", styleId: "dateRange" },
      { name: "days", column: "D", styleId: "default" },
    ],
    predefined: {
      data: [
        { cell: "B1", value: "ПІБ", styleId: "header" },
        { cell: "A1", value: "Звання", styleId: "header" },
        { cell: "C1", value: "Період", styleId: "header" },
        { cell: "D1", value: "Днів", styleId: "header" },
      ],
      columnStyles: [
        { column: "A", id: "autofit" },
        { column: "B", id: "autofit" },
        { column: "C", id: "wide" },
        { column: "D", id: "autofit" },
      ],
    },
  };

  const [month, year] = monthStr.split(".");

  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const name = `${normalizeDay(day)}.${monthStr}`;
    const column = getExcelColumn("E", day);

    schema.fields.push({
      name,
      column,
      styleId: "default",
    });
    schema.predefined.data.push({ value: name, cell: `${column}1`, styleId: "payrollDate" });
    schema.predefined.columnStyles.push({ column, id: "autofit" });
  }

  return schema;
};
