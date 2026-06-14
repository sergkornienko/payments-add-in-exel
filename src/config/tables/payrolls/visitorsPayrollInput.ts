import { TableSchema } from "../../../infra/exel/TableSchema";
import { normalizeDay, getExcelColumn } from "../helpers";

export const getVisitorsPayrollSchema = (monthStr: string, startRow: number = 2): TableSchema => {
  const schema: TableSchema = {
    startRow,
    sheetName: "Відвідування",
    fields: [
      { name: "unit", column: "A" },
      { name: "militaryRank", column: "C" },
      { name: "fullName", column: "D" },
    ],
  };

  const [month, year] = monthStr.split(".");

  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const name = `${normalizeDay(day)}.${monthStr}`;
    const column = getExcelColumn("D", day);

    schema.fields.push({
      name,
      column,
    });
  }

  return schema;
};
