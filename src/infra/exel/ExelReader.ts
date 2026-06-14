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

        if (usedRange.rowIndex + usedRange.values.length < this.schema.startRow) {
          return [];
        }

        const dataStartRow = this.schema.startRow - 1 - usedRange.rowIndex;

        if (dataStartRow < 0 || dataStartRow >= usedRange.values.length) {
          return [];
        }

        const dataRows = usedRange.values.slice(dataStartRow);

        return dataRows
          .filter((row) => row.some((cell) => cell !== null && cell !== ""))
          .map((row) => {
            const item: any = {};

            this.schema.fields.forEach((field) => {
              const colIndex = this.columnLetterToIndex(field.column) - usedRange.columnIndex;
              let value: any = row[colIndex] ?? null;

              // Handle date conversion if field is marked as date type and value is a valid Excel date serial number
              // Excel dates are positive integers starting from 1 (1900-01-01)
              // We'll be conservative and only convert positive integers in a reasonable range
              if (
                field.type === "date" &&
                typeof value === "number" &&
                !isNaN(value) &&
                Number.isInteger(value) &&
                value >= 1 &&
                value <= 2958463
              ) {
                value = this.excelDateToFormattedString(value);
              }

              item[field.name] = value;
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

  /**
   * Converts Excel date serial number to formatted string (DD.MM.YYYY)
   * Excel epoch: January 1, 1900 (with the known 1900 leap year bug)
   */
  private excelDateToFormattedString(excelDate: number): string {
    // Excel date serial number to JS date conversion
    // Excel counts days from 1900-01-01, but incorrectly treats 1900 as a leap year
    // For dates on or after 1900-03-01 (serial 61+), we need to subtract an extra day
    const adjustedExcelDate = excelDate >= 61 ? excelDate - 1 : excelDate;

    // Convert to JS date: Excel epoch (1900-01-01) to Unix epoch (1970-01-01)
    // Days from 1970-01-01 to 1899-12-30 = 25567
    const jsDate = new Date((adjustedExcelDate - 25568) * 86400 * 1000); // 25568 = days from 1970-01-01 to 1899-12-31

    const dd = String(jsDate.getDate()).padStart(2, "0");
    const mm = String(jsDate.getMonth() + 1).padStart(2, "0");
    const yyyy = jsDate.getFullYear();

    return `${dd}.${mm}.${yyyy}`;
  }
}
