import { PayrollParserService } from "../PayrollParserService";
import { v4 as uuidv4 } from "uuid";

// Mock uuid so tests are predictable
jest.mock("uuid", () => ({ v4: () => "uuid-mock" }));

describe("PayrollParserService.parseDateRanges", () => {
  const makeRaw = (fullName: string, militaryRank: string, dates: string) => ({
    fullName,
    militaryRank,
    dates,
  });

  it("should return empty array for empty input", () => {
    const result = PayrollParserService.parseDateRanges([]);
    expect(result).toEqual([]);
  });

  it("should parse a single date range", () => {
    const raw = [makeRaw("John Doe", "Soldier", "01.01.2026-05.01.2026")];
    const result = PayrollParserService.parseDateRanges(raw);

    expect(result).toHaveLength(1);
    const item = result[0];
    expect(item.serviceman.fullName.toString()).toBe("JOHN Doe");
    // @ts-ignore
    expect(item.dateRanges).toHaveLength(1);
    // @ts-ignore
    expect(item.dateRanges[0].startDate).toBe("01.01.2026");
    // @ts-ignore
    expect(item.dateRanges[0].endDate).toBe("05.01.2026");
  });

  it("should merge date ranges in the same month for the same serviceman", () => {
    const raw = [
      makeRaw("John Doe", "Soldier", "01.01.2026-05.01.2026"),
      makeRaw("John Doe", "Soldier", "06.01.2026-10.01.2026"),
    ];
    const result = PayrollParserService.parseDateRanges(raw);

    expect(result).toHaveLength(1);
    const item = result[0];
    // @ts-ignore
    expect(item.dateRanges[0].toString()).toBe("з 01.01.2026 по 10.01.2026");
  });

  it("should create separate PayrollItems for different months", () => {
    const raw = [
      makeRaw("John Doe", "Soldier", "28.01.2026-31.01.2026"),
      makeRaw("John Doe", "Soldier", "01.02.2026-05.02.2026"),
    ];
    const result = PayrollParserService.parseDateRanges(raw);

    expect(result).toHaveLength(2);
    expect(result[0].getMonthAndYear()).toBe("01.2026");
    expect(result[1].getMonthAndYear()).toBe("02.2026");
  });

  it("should sort multiple servicemen by fullName", () => {
    const raw = [
      makeRaw("Zack Smith", "Soldier", "01.01.2026-05.01.2026"),
      makeRaw("Alice Johnson", "Soldier", "01.01.2026-05.01.2026"),
    ];
    const result = PayrollParserService.parseDateRanges(raw);

    expect(result[0].serviceman.fullName.toString()).toBe("ALICE Johnson");
    expect(result[1].serviceman.fullName.toString()).toBe("ZACK Smith");
  });

  it("should handle multiple date ranges across multiple servicemen and months", () => {
    const raw = [
      makeRaw("John Doe", "Soldier", "01.01.2026-05.01.2026;06.01.2026-10.01.2026"),
      makeRaw("John Doe", "Soldier", "01.02.2026-03.02.2026"),
      makeRaw("Alice Johnson", "Soldier", "15.01.2026-20.01.2026"),
    ];

    const result = PayrollParserService.parseDateRanges(raw);

    // 3 PayrollItems: John Jan, John Feb, Alice Jan
    expect(result).toHaveLength(3);
    expect(result.map((i) => i.serviceman.fullName.toString())).toEqual([
      "ALICE Johnson",
      "JOHN Doe",
      "JOHN Doe",
    ]);
    expect(result.map((i) => i.getMonthAndYear())).toEqual(["01.2026", "01.2026", "02.2026"]);
  });
});
