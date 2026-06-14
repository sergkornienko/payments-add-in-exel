const toDate = (s: string): Date => {
  const match = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);
  if (!match) {
    throw new Error(`Invalid date format: ${s}`);
  }

  const [, dd, mm, yyyy] = match.map(Number);
  const date = new Date(yyyy, mm - 1, dd);

  if (date.getFullYear() !== yyyy || date.getMonth() !== mm - 1 || date.getDate() !== dd) {
    throw new Error(`Invalid calendar date: ${s}`);
  }

  return date;
};

const format = (d: Date): string => {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();

  return `${dd}.${mm}.${yyyy}`;
};

const splitByMonth = (from: Date, to: Date): DateRange[] => {
  const result: DateRange[] = [];
  let current = new Date(from);

  while (current <= to) {
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);

    const rangeEnd = monthEnd < to ? monthEnd : to;

    result.push(new DateRange(format(current), format(rangeEnd)));

    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  return result;
};

export class DateRange {
  private static CreateRange(startDay: number, endDay: number, monthAndYear: string): DateRange {
    const startDate = `${String(startDay).padStart(2, "0")}.${monthAndYear}`;
    const endDate = `${String(endDay).padStart(2, "0")}.${monthAndYear}`;
    return new DateRange(startDate, endDate);
  }

  static FromInstructorsString(input: string, month: string): DateRange[] {
    if (!input || !month) {
      return [];
    }

    // Validate month format MM.YYYY
    if (!/^\d{2}\.\d{4}$/.test(month)) {
      throw new Error("Invalid month format. Expected MM.YYYY");
    }

    // Extract day numbers, ignoring (num) patterns
    const days = input
      .split(",")
      .map((part) => part.trim())
      .map((part) => part.replace(/\s*\(\d+\)\s*/g, "")) // Remove (num) patterns
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .map((day) => parseInt(day, 10))
      .filter((day) => !isNaN(day) && day >= 1 && day <= 31);

    if (days.length === 0) {
      return [];
    }

    // ✅ Remove duplicates and sort
    const uniqueSortedDays = Array.from(new Set(days)).sort((a, b) => a - b);

    // Group consecutive days into ranges
    const ranges: DateRange[] = [];
    let rangeStart = uniqueSortedDays[0];
    let rangeEnd = uniqueSortedDays[0];

    for (let i = 1; i < uniqueSortedDays.length; i++) {
      if (uniqueSortedDays[i] === rangeEnd + 1) {
        // Consecutive day, extend range
        rangeEnd = uniqueSortedDays[i];
      } else {
        // Gap found, save current range and start new one
        ranges.push(this.CreateRange(rangeStart, rangeEnd, month));
        rangeStart = uniqueSortedDays[i];
        rangeEnd = uniqueSortedDays[i];
      }
    }

    // Add the last range
    ranges.push(this.CreateRange(rangeStart, rangeEnd, month));

    return ranges;
  }

  static FromString(input: string): DateRange[] {
    try {
      const parseDate = (s: string): string => {
        const match = s.match(/\d{2}\.\d{2}\.\d{4}/);
        if (!match) throw new Error(`Invalid date: ${s}`);
        return match[0];
      };

      const parts = input
        .replace(/;/g, ",")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean);

      return parts.flatMap((part) => {
        let from: string;
        let to: string;

        if (/з\s+\d{2}\.\d{2}\.\d{4}\s+по\s+\d{2}\.\d{2}\.\d{4}/i.test(part)) {
          const dates = part.match(/\d{2}\.\d{2}\.\d{4}/g)!;
          [from, to] = dates;
        } else if (/\d{2}\.\d{2}\.\d{4}\s*-\s*\d{2}\.\d{2}\.\d{4}/.test(part)) {
          [from, to] = part.split("-").map(parseDate);
        } else {
          const d = parseDate(part);
          [from, to] = [d, d];
        }

        const start = toDate(from);
        const end = toDate(to);

        return splitByMonth(start, end);
      });
    } catch (error) {
      console.log(input);
      throw error;
    }
  }

  static Combine(
    ranges: DateRange[],
    // it can be same month or year depends on how do we want to combine ranges
    samePeriod: (a: Date, b: Date) => boolean = (a: Date, b: Date) =>
      a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  ): DateRange[] {
    if (ranges.length === 0) return [];

    const toDate = (s: string) => {
      const [d, m, y] = s.split(".").map(Number);
      return new Date(y, m - 1, d);
    };

    const toString = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}.${d.getFullYear()}`;

    const isNextDay = (a: Date, b: Date) => a.getTime() + 24 * 60 * 60 * 1000 === b.getTime();

    // Normalize & sort
    const sorted = [...ranges].sort(
      (a, b) => toDate(a.startDate).getTime() - toDate(b.startDate).getTime()
    );

    const result: DateRange[] = [];
    let current = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];

      const curStart = toDate(current.startDate);
      const curEnd = toDate(current.endDate);
      const nextStart = toDate(next.startDate);
      const nextEnd = toDate(next.endDate);

      // Remove fully covered ranges
      if (nextStart >= curStart && nextEnd <= curEnd && samePeriod(curStart, nextStart)) {
        continue;
      }

      // Merge continuous ranges in same month
      if (
        samePeriod(curStart, nextStart) &&
        (isNextDay(curEnd, nextStart) || nextStart <= curEnd)
      ) {
        current = new DateRange(
          current.startDate,
          toString(new Date(Math.max(curEnd.getTime(), nextEnd.getTime())))
        );
      } else {
        result.push(current);
        current = next;
      }
    }

    result.push(current);
    return result;
  }

  constructor(
    public readonly startDate: string,
    public readonly endDate: string
  ) {
    this.startDate = startDate.trim();
    this.endDate = endDate.trim();

    if (!this.isValidDate(this.startDate) || !this.isValidDate(this.endDate)) {
      throw new Error("Invalid date format");
    }
  }

  private isValidDate(date: string): boolean {
    // Validate DD.MM.YYYY format
    return /^\d{2}\.\d{2}\.\d{4}$/.test(date);
  }

  public getMonthAndYear(): string {
    return this.startDate.trim().substring(3);
  }

  isSingleDay(): boolean {
    return this.startDate === this.endDate;
  }

  toString(): string {
    if (this.isSingleDay()) {
      return `за ${this.startDate}`;
    }
    return `з ${this.startDate} по ${this.endDate}`;
  }
}
