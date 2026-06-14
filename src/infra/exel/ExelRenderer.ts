import { ITableRenderer, RenderOverride } from "../../core";
import { StyleRenderer } from "./StyleRenderer";
import { FieldSchema, TableSchema } from "./TableSchema";

export class ExcelRenderer<T> implements ITableRenderer<T> {
  constructor(
    private schema: TableSchema,
    private styleRenderer: StyleRenderer
  ) {}

  async render(payload: T[], overrides?: RenderOverride<T>[]) {
    if (!payload || !Array.isArray(payload) || payload.length === 0) return;

    try {
      await Excel.run(async (context) => {
        const sheet = await this.getSheet(context, this.schema.sheetName);
        const startRow = this.schema.startRow;

        // 1️⃣ Calculate row block size (max merge rows)
        const rowBlockSize = this.schema.fields.reduce(
          (max, field) => Math.max(max, field.merge?.rows ?? 1),
          1
        );

        // 2️⃣ Preprocess overrides
        const overrideMap = new Map<string, Map<string, string>>();
        overrides?.forEach((h) => {
          if (!overrideMap.has(h.rowId)) {
            overrideMap.set(h.rowId, new Map());
          }
          overrideMap.get(h.rowId)!.set(String(h.field), h.styleId);
        });

        // 3️⃣ Render fields
        for (const fieldSchema of this.schema.fields) {
          const rowShift = fieldSchema.rowShift ?? 0;
          const values: any[][] = [];

          // Build values respecting rowShift
          for (let i = 0; i < payload.length; i++) {
            const row = payload[i];
            const value = row ? row[fieldSchema.name as keyof T] : null;

            for (let j = 0; j < rowBlockSize; j++) {
              if (j === rowShift) {
                values.push([value ?? null]);
              } else {
                values.push([null]);
              }
            }
          }

          const endRow = startRow + values.length - 1;
          const range = sheet.getRange(
            `${fieldSchema.column}${startRow}:${fieldSchema.column}${endRow}`
          );
          range.values = values;

          // 4️⃣ Apply styles (rowShift-aware)
          for (let i = 0; i < payload.length; i++) {
            const rowId = (payload[i] as any).id;
            const targetRow = startRow + i * rowBlockSize + rowShift;

            const styleId =
              overrideMap.get(rowId)?.get(String(fieldSchema.name)) || fieldSchema.styleId;

            if (styleId) {
              this.styleRenderer.applyStyle(
                sheet.getRange(`${fieldSchema.column}${targetRow}`),
                styleId
              );
            }
          }

          // 5️⃣ Merge cells PER BLOCK (rowShift does NOT affect merge start)
          if (fieldSchema.merge?.rows && fieldSchema.merge.columns) {
            for (let i = 0; i < payload.length; i++) {
              const blockStart = startRow + i * rowBlockSize;
              const blockEnd = blockStart + fieldSchema.merge.rows - 1;

              const mergeRange = sheet.getRange(
                `${fieldSchema.column}${blockStart}:${fieldSchema.merge.columns}${blockEnd}`
              );
              mergeRange.merge();
            }
          }
        }

        // 6️⃣ Render predefined cells & column styles
        if (this.schema.predefined) {
          this.schema.predefined.data.forEach((item) => {
            const cell = sheet.getRange(item.cell);
            cell.values = [[item.value]];
            if (item.styleId) {
              this.styleRenderer.applyStyle(cell, item.styleId);
            }
          });

          this.schema.predefined.columnStyles.forEach((item) => {
            const range = sheet.getRange(`${item.column}:${item.column}`);
            this.styleRenderer.applyColumnStyle(range, item.id);
          });

          sheet.getUsedRange().format.autofitRows();
        }

        await context.sync();
      });
    } catch (error) {
      console.log("render", error);
    }
  }

  // first version
  // async render(payload: T[], overrides?: RenderOverride<T>[]) {
  //   try {
  //     await Excel.run(async (context) => {
  //       const maxMergeRows = this.schema.fields.reduce((max, field) => {
  //         if (field.merge && field.merge.rows) {
  //           return Math.max(max, field.merge.rows);
  //         }
  //         return max;
  //       }, 1);

  //       const sheet = await this.getSheet(context, this.schema.sheetName);
  //       let currentRowIndex = this.schema.startRow;

  //       for (let i = 0; i < payload.length; i++) {
  //         const row = payload[i];
  //         if (i) {
  //           currentRowIndex += maxMergeRows;
  //         }

  //         for (const fieldSchema of this.schema.fields) {
  //           const value = row[fieldSchema.name as keyof T];
  //           const rowShift = fieldSchema.rowShift || 0;
  //           const cell = sheet.getRange(`${fieldSchema.column}${currentRowIndex + rowShift}`);
  //           cell.values = [[value]];

  //           const hint = overrides?.find(
  //             (h) => h.rowId === (row as any).id && h.field === fieldSchema.name
  //           );
  //           const styleId = hint?.styleId || fieldSchema.styleId;
  //           if (styleId) {
  //             this.styleRenderer.applyStyle(cell, styleId);
  //           }

  //           this.mergeCells(fieldSchema, currentRowIndex, sheet);
  //         }
  //       }

  //       this.renderPredefined(sheet);

  //       await context.sync();
  //     });
  //   } catch (error) {
  //     console.log("render", error);
  //   }
  // }

  private renderPredefined(sheet: Excel.Worksheet) {
    try {
      if (!this.schema.predefined) {
        return;
      }

      this.schema.predefined.data.forEach((item) => {
        const cell = sheet.getRange(item.cell);
        cell.values = [[item.value]];

        if (item.styleId) {
          this.styleRenderer.applyStyle(cell, item.styleId);
        }
      });

      this.schema.predefined.columnStyles.forEach((item) => {
        const range = sheet.getRange(`${item.column}:${item.column}`);
        this.styleRenderer.applyColumnStyle(range, item.id);
      });

      sheet.getUsedRange().format.autofitRows();
    } catch (error) {
      console.log("renderPredefined", error);
    }
  }

  private async getSheet(context: Excel.RequestContext, sheetName: string) {
    try {
      let sheet;

      if (sheetName) {
        sheet = context.workbook.worksheets.getItemOrNullObject(sheetName);
        await context.sync();

        if (sheet.isNullObject) {
          sheet = context.workbook.worksheets.add(sheetName);
        }
      } else {
        sheet = context.workbook.worksheets.getActiveWorksheet();
      }

      return sheet;
    } catch (error) {
      console.log("getSheet", error);
      throw error;
    }
  }

  private mergeCells(fieldSchema: FieldSchema, currentRowIndex, sheet: Excel.Worksheet) {
    try {
      if (fieldSchema.merge) {
        const endRow = currentRowIndex + (fieldSchema.merge.rows - 1);
        const mergeRange = sheet.getRange(
          `${fieldSchema.column}${currentRowIndex}:${fieldSchema.merge.columns}${endRow}`
        );
        mergeRange.merge();
      }
    } catch (error) {
      console.log("mergeCells", error);
    }
  }
}
