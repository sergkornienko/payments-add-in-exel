export interface ITableRenderer<T> {
  render(payload: T[], overrides?: RenderOverride<T>[]): Promise<void>;
}

export type RenderOverride<T> = {
  rowId: string;
  field: keyof T;
  styleId?: string;
};
