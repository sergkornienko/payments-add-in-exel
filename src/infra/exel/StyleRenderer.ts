export interface CellStyle {
  textColor?: string;
  fillColor?: string;
  fontSize?: number;
  textOrientation?: 0 | 90 | -90 | 45;
  bold?: boolean;
  wrapText?: boolean;
  horizontalAlignment?: Excel.HorizontalAlignment;
  verticalAlignment?: Excel.VerticalAlignment;
}
interface ColumnStyle {
  width: number;
}

export class StyleRenderer {
  constructor(
    private readonly cellStyles: Record<string, CellStyle>,
    private readonly columnStyles: Record<string, ColumnStyle>
  ) {}

  applyStyle(cell: Excel.Range, styleId: string) {
    try {
      const style = this.cellStyles[styleId];
      if (!style) return;
      if (style.textColor) cell.format.font.color = style.textColor;
      if (style.fillColor) cell.format.fill.color = style.fillColor;
      if (style.fontSize) cell.format.font.size = style.fontSize;
      if (style.textOrientation) cell.format.textOrientation = style.textOrientation;
      if (style.bold) cell.format.font.bold = style.bold;
      if (style.wrapText) cell.format.wrapText = style.wrapText;
      if (style.horizontalAlignment) cell.format.horizontalAlignment = style.horizontalAlignment;
      if (style.verticalAlignment) cell.format.verticalAlignment = style.verticalAlignment;
    } catch (error) {
      console.log("applyStyle", styleId, error);
    }
  }

  applyColumnStyle(range: Excel.Range, styleId: string) {
    try {
      const style = this.columnStyles[styleId];
      if (!style) return;
      if (style.width === -1) {
        range.format.autofitColumns();
      } else if (style.width) range.format.columnWidth = style.width;
    } catch (error) {
      console.log("applyColumnStyle", styleId, error);
    }
  }
}
