import { TableSchema } from "../../../../infra/exel/TableSchema";
import { normalizeDay, getExcelColumn } from "../../helpers";

const SCHEMA: TableSchema = {
  startRow: 2,
  fields: [
    { name: "reason", column: "A" },
    { name: "unit", column: "B" },
    { name: "militaryRank", column: "C" },
    { name: "fullName", column: "D" },
    { name: "taxPayerId", column: "E" },
  ],
};

export const getSummaryPayrollSchema = (
  monthStr: string,
  options: Partial<TableSchema> = { startRow: 2 }
): TableSchema => {
  const schema: TableSchema = {
    ...SCHEMA,
    ...options,
  };

  const [month, year] = monthStr.split(".");

  const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const name = `${normalizeDay(day)}.${monthStr}`;
    const column = getExcelColumn("E", day);

    schema.fields.push({
      name,
      column,
    });
  }

  return schema;
};

export const getAuditPayrollSchema = (
  startDateStr: string,
  options: Partial<TableSchema> = { startRow: 2 }
): TableSchema => {
  const schema: TableSchema = {
    ...SCHEMA,
    fields: [
      { name: "fullName", column: "A" },
      { name: "taxPayerId", column: "B" },
      { name: "taxPayerId", column: "C" },
    ],
    ...options,
  };

  const [day, month, year] = startDateStr.split(".").map(Number);
  const startDate = new Date(year, month - 1, day);

  // Last day of previous month relative to today
  const today = new Date();
  const endDate = new Date(today.getFullYear(), today.getMonth(), 0);

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dd = normalizeDay(d.getDate());
    const mm = normalizeDay(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const name = `${dd}.${mm}.${yyyy}`;
    const dayOffset = Math.round((d.getTime() - startDate.getTime()) / 86400000);
    const column = getExcelColumn("C", dayOffset + 1);
    schema.fields.push({ name, column });
  }

  return schema;
};
