import { SelectedValues } from "src/core/app/ports/ITableReader";
import { ITableReader } from "../../core";
import { TableSchema } from "./TableSchema";

export class ExcelReader<T> implements ITableReader<T> {
  constructor(private schema: TableSchema) {}

  async read(): Promise<T[]> {
    try {
      return await Excel.run(async (context) => {
        const sheet = await this.getSheet(context);

        // Load the entire used range
        const usedRange = sheet.getUsedRange();
        usedRange.load(["values", "rowIndex", "columnIndex"]);
        await context.sync();

        // Check if we have data
        if (usedRange.rowIndex + usedRange.values.length < this.schema.startRow) {
          return [];
        }

        // Calculate start position in the used range values array
        const dataStartRow = this.schema.startRow - 1 - usedRange.rowIndex;

        if (dataStartRow < 0 || dataStartRow >= usedRange.values.length) {
          return [];
        }

        // Extract relevant rows
        const dataRows = usedRange.values.slice(dataStartRow);

        // Map to DTOs
        return dataRows
          .filter((row) => row.some((cell) => cell !== null && cell !== ""))
          .map((row) => {
            const item: any = {};

            this.schema.fields.forEach((field) => {
              const colIndex = this.columnLetterToIndex(field.column) - usedRange.columnIndex;
              if (colIndex >= 0 && colIndex < row.length) {
                item[field.name] = row[colIndex] ?? null;
              } else {
                item[field.name] = null;
              }
            });

            return item as T;
          });
      });
    } catch (error) {
      console.log(this.schema, error);
      throw error;
    }
  }

  async getSelected(): Promise<SelectedValues<T>> {
    return await Excel.run(async (context) => {
      const sheet = context.workbook.worksheets.getActiveWorksheet();

      const selectedRanges = context.workbook.getSelectedRanges();
      selectedRanges.load(["areas"]);
      await context.sync();

      const areas = selectedRanges.areas;
      areas.load("items");
      await context.sync();

      areas.items.forEach((area) => {
        area.load(["rowIndex", "columnIndex", "columnCount", "rowCount", "values"]);
      });
      await context.sync();

      const allValues: T[keyof T][] = [];
      const columnIndices = new Set<number>();

      for (const area of areas.items) {
        for (const row of area.values) {
          for (const cell of row) {
            allValues.push(cell as T[keyof T]);
          }
        }

        for (let col = area.columnIndex; col < area.columnIndex + area.columnCount; col++) {
          columnIndices.add(col);
        }
      }

      const sortedColumns = Array.from(columnIndices).sort((a, b) => a - b);
      const headerCells = sortedColumns.map((colIndex) =>
        sheet.getRangeByIndexes(0, colIndex, 1, 1)
      );
      headerCells.forEach((cell) => cell.load(["values"]));
      await context.sync();

      const headerValues = headerCells.map((cell) => cell.values[0][0] as T[keyof T]);

      return {
        values: allValues,
        header: headerValues,
      };
    });
  }

  private async getSheet(context: Excel.RequestContext): Promise<Excel.Worksheet> {
    if (!this.schema.sheetName) {
      return context.workbook.worksheets.getActiveWorksheet();
    }

    const sheet = context.workbook.worksheets.getItemOrNullObject(this.schema.sheetName);
    await context.sync();

    return sheet.isNullObject ? context.workbook.worksheets.add(this.schema.sheetName) : sheet;
  }

  private columnLetterToIndex(column: string): number {
    let index = 0;
    for (const char of column.toUpperCase()) {
      index = index * 26 + (char.charCodeAt(0) - 64);
    }
    return index - 1;
  }
}
