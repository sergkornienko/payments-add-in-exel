import { CellStyle } from "../../infra";

export const STYLES: Record<string, CellStyle> = {
  //medical payroll
  header: {
    horizontalAlignment: "Center" as any,
    verticalAlignment: "Center" as any,
    bold: true,
  },
  dateRange: { wrapText: true },
  payrollDate: { textOrientation: 90, bold: true },
  default: {},
  // visitors
  visitors: { fillColor: "#f0b840" },
};

export const COLUMN_STYLES = {
  autofit: { width: -1 },
  wide: { width: 250 },
};
