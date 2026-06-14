import { TableSchema } from "src/infra/exel/TableSchema";
import { normalizeDay, getExcelColumn } from "../helpers";

export const getCommentsTableSchema = (
  monthStr: string,
  payload: Partial<TableSchema> = {}
): TableSchema => {
  const schema: TableSchema = {
    startRow: 1,
    fields: [{ name: "comment", column: "AL", styleId: "default" }],
    ...payload,
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
