export type PayrollValue = 30 | 50 | 70 | 100;

export const isPayrollValue = (value: number): value is PayrollValue => {
  return value === 30 || value === 50 || value === 70 || value === 100;
};
