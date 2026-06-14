import { Serviceman } from "./Serviceman";
import { DateRange } from "../value-objects/DateRange";
import { v4 as uuidv4 } from "uuid";
import { PayrollRenderItem, PayrollValue } from "../value-objects";

const DEFAULT_VALUE = 100;

export class PayrollItem {
  static Create(
    serviceman: Serviceman,
    dateRanges: DateRange[],
    value: PayrollValue = DEFAULT_VALUE,
    reason?: string
  ): PayrollItem {
    return new PayrollItem(uuidv4(), serviceman, dateRanges, value, reason);
  }

  private payrollDays: Record<string, number> = {}; // {"15.01.2024": 100}

  constructor(
    public readonly id: string,
    public readonly serviceman: Serviceman,
    private dateRanges: DateRange[],
    public readonly value: PayrollValue,
    public readonly reason?: string
  ) {
    this.calculatePayrollDays();
  }

  getTotalDays(): number {
    return this.getDates().length;
  }

  getMonthAndYear(): string {
    return this.dateRanges[0]?.getMonthAndYear();
  }

  getRenderItem(): PayrollRenderItem {
    return {
      fullName: this.serviceman.fullName.toString(),
      militaryRank: this.serviceman.militaryRank,
      taxPayerId: this.serviceman.taxPayerId,
      unit: this.serviceman.unit,
      dateRange: this.dateRanges.map((range) => range.toString()).join("; "),
      days: this.getTotalDays(),
      reason: this.reason,
      ...this.payrollDays,
    };
  }

  addDateRange(dateRange: DateRange) {
    this.dateRanges.push(dateRange);
    this.calculatePayrollDays();
  }

  getDates() {
    return Object.keys(this.payrollDays);
  }

  private calculatePayrollDays(): void {
    this.payrollDays = {};
    this.dateRanges = DateRange.Combine(this.dateRanges);

    this.dateRanges.forEach((dateRange) => {
      const start = this.parseDate(dateRange.startDate);
      const end = this.parseDate(dateRange.endDate);

      let currentDate = new Date(start);

      while (currentDate <= end) {
        const dateKey = this.formatDate(currentDate);
        this.payrollDays[dateKey] = this.value;

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }
    });
  }

  private parseDate(dateStr: string): Date {
    // Parse "DD.MM.YYYY" format
    const [day, month, year] = dateStr.split(".").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in Date
  }

  private formatDate(date: Date): string {
    // Format as "DD.MM.YYYY"
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
}
