import { PayrollValue } from "./PayrollValue";

export type DailyValues = {
  [day: string]: PayrollValue | string | number | undefined; // only payroll numbers for dynamic keys
};

export type RawPayrollData = {
  fullName: string;
  militaryRank: string;
  unit: string;
  taxPayerId?: string | number;
  reason?: string;
} & DailyValues;
