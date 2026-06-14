export interface SelectedValues<T> {
  values: T[keyof T][];
  header: T[keyof T][];
}

export interface ITableReader<T> {
  read(): Promise<T[]>;
  getSelected(): Promise<SelectedValues<T>>;
}
