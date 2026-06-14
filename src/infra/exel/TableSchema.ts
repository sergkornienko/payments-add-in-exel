export interface FieldSchema {
  name: string;
  column: string;
  merge?: { rows: number; columns: string };
  styleId?: string;
  rowShift?: number;
}

export interface PredefinedRenders {
  data: { cell: string; value: string; styleId?: string }[];
  columnStyles: { id: string; column: string }[];
}

export interface TableSchema {
  startRow: number;
  fields: FieldSchema[];
  sheetName?: string;
  predefined?: PredefinedRenders;
}
