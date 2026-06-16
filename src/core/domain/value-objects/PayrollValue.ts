export type PayrollValue = 10 | 20 | 30 | 40 | 50 | 70 | 100 | 170;

export const isPayrollValue = (value: number): value is PayrollValue => {
  return value === 10 || value === 20 || value === 30 || value === 40 || value === 50 || value === 70 || value === 100 || value === 170;
};
