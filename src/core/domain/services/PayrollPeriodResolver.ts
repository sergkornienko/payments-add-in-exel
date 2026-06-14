import { PayrollItem, Serviceman } from "../entities";
import { DateRange, isPayrollValue, PayrollValue, RawPayrollData } from "../value-objects";

export const normalizeDay = (day: number) => (day < 10 ? `0${day}` : day);

export class PayrollPeriodResolver {
  constructor() {}

  resolve(
    data: RawPayrollData[],
    monthStr: string
  ): {
    payrolls: Map<PayrollValue, PayrollItem[]>;
    payrollsByServiceman: Map<string, PayrollItem[]>;
  } {
    const [month, year] = monthStr.split(".");
    const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

    const payrollsByServiceman = new Map<string, PayrollItem[]>();
    const payrolls = new Map<PayrollValue, PayrollItem[]>();

    data.forEach((item) => {
      const ranges = this.extractRangesFromRawPayrollItem(item, daysInMonth, monthStr);
      this.groupPayrollItems(item, ranges, payrolls, payrollsByServiceman);
    });

    return { payrolls, payrollsByServiceman };
  }

  extractRangesFromRawPayrollItem(
    item: RawPayrollData,
    daysInMonth: number,
    monthStr: string
  ): Map<number, DateRange[]> {
    const ranges = new Map<number, DateRange[]>();
    let rangeStart: string | null = null;
    let rangeValue: number | null = null;

    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = `${normalizeDay(day)}.${monthStr}`;
      const currentValue = item[currentDate] ? Number(item[currentDate]) : null;
      const isLastDay = day === daysInMonth;

      // If we're not in a range and found a value - start new range
      if (rangeStart === null && !!currentValue) {
        rangeStart = currentDate;
        rangeValue = Number(currentValue);
      }
      // If we're in a range and value changed (or became null) - close current range
      else if (rangeStart !== null && currentValue !== rangeValue) {
        const rangeEnd = `${normalizeDay(day - 1)}.${monthStr}`;
        if (rangeValue) {
          this.addRangeWithSplit(ranges, rangeValue, rangeStart, rangeEnd);
        }

        // Start new range if current value is not null
        if (!!currentValue) {
          rangeStart = currentDate;
          rangeValue = Number(currentValue);
        } else {
          rangeStart = null;
          rangeValue = null;
        }
      }

      if (isLastDay && rangeStart && rangeValue) {
        this.addRangeWithSplit(ranges, rangeValue, rangeStart, currentDate);
      }
    }

    return ranges;
  }

  private groupPayrollItems(
    item: RawPayrollData,
    ranges: Map<number, DateRange[]>,
    payrolls: Map<PayrollValue, PayrollItem[]>,
    payrollsByServiceman: Map<string, PayrollItem[]>
  ) {
    const key = String(item.taxPayerId || item.fullName);

    for (const [value, dateRanges] of ranges) {
      if (!isPayrollValue(value)) continue;

      const payrollItem = PayrollItem.Create(
        Serviceman.FromRawExtended(item),
        dateRanges,
        value,
        item.reason
      );

      // By serviceman
      const servicemanPayrolls = payrollsByServiceman.get(key) || [];
      payrollsByServiceman.set(key, [...servicemanPayrolls, payrollItem]);

      // By payroll value
      const previousPayrolls = payrolls.get(value) || [];
      payrolls.set(value, [...previousPayrolls, payrollItem]);
    }
  }

  private addRangeWithSplit(
    ranges: Map<number, DateRange[]>,
    value: number,
    startDate: string,
    endDate: string
  ): void {
    const dateRange = new DateRange(startDate, endDate);

    if (value === 170) {
      // Split 170 into 100 and 70
      const ranges100 = ranges.get(100) || [];
      ranges.set(100, [...ranges100, dateRange]);

      const ranges70 = ranges.get(70) || [];
      ranges.set(70, [...ranges70, dateRange]);
    } else {
      // Regular value (100, 70, 50, 30, etc.)
      const existingRanges = ranges.get(value) || [];
      ranges.set(value, [...existingRanges, dateRange]);
    }
  }
}
