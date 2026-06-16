import { PayrollPeriodResolver } from "../PayrollPeriodResolver";
import { PayrollValue, RawPayrollData } from "../../";
import { v4 as uuidv4 } from "uuid";

// Mock uuid so tests are predictable
jest.mock("uuid", () => ({ v4: () => "uuid-mock" }));

describe("PayrollPeriodResolver.", () => {
  let resolver: PayrollPeriodResolver;

  beforeEach(() => {
    resolver = new PayrollPeriodResolver();
  });

  function makeRow(values: (PayrollValue | null)[], servicemanData = {}): RawPayrollData {
    const row: RawPayrollData = {
      fullName: "John Doe",
      militaryRank: "soldier",
      unit: "1 BOP",
      taxPayerId: "taxPayerId",
      ...servicemanData,
    };
    values.forEach((v, i) => {
      const day = String(i + 1).padStart(2, "0");
      row[`${day}.01.2026`] = v;
    });
    return row; // for simplicity
  }

  describe("extractRangesFromRawPayrollItem", () => {
    it("returns single range when values are continuous", () => {
      const row = makeRow([30, 30, 30, null, null]);
      const ranges = resolver.extractRangesFromRawPayrollItem(row, 5, "01.2026");

      expect(ranges.size).toBe(1);
      const dateRanges = ranges.get(30);
      expect(dateRanges).toHaveLength(1);
      expect(dateRanges![0].startDate).toBe("01.01.2026");
      expect(dateRanges![0].endDate).toBe("03.01.2026");
    });

    it("splits ranges when values change", () => {
      const row = makeRow([30, 30, 50, 50, 30]);
      const ranges = resolver.extractRangesFromRawPayrollItem(row, 5, "01.2026");

      expect(ranges.size).toBe(2);
      expect(ranges.get(30)).toHaveLength(2);
      expect(ranges.get(50)).toHaveLength(1);

      expect(ranges.get(30)![0].startDate).toBe("01.01.2026");
      expect(ranges.get(30)![0].endDate).toBe("02.01.2026");
      expect(ranges.get(30)![1].startDate).toBe("05.01.2026");
      expect(ranges.get(30)![1].endDate).toBe("05.01.2026");

      expect(ranges.get(50)![0].startDate).toBe("03.01.2026");
      expect(ranges.get(50)![0].endDate).toBe("04.01.2026");
    });

    it("handles null and undefined correctly", () => {
      const row = makeRow([null, 30, undefined, 30, null]);
      const ranges = resolver.extractRangesFromRawPayrollItem(row, 5, "01.2026");

      expect(ranges.size).toBe(1);
      const dateRanges = ranges.get(30);
      expect(dateRanges).toHaveLength(2);

      expect(dateRanges![0].startDate).toBe("02.01.2026");
      expect(dateRanges![0].endDate).toBe("02.01.2026");

      expect(dateRanges![1].startDate).toBe("04.01.2026");
      expect(dateRanges![1].endDate).toBe("04.01.2026");
    });

    it("handles value 170 as a single value (does not split)", () => {
      // @ts-ignore
      const row = makeRow([170, 170, 70, 100]);
      const ranges = resolver.extractRangesFromRawPayrollItem(row, 4, "01.2026");

      // We expect 170 to be treated as a single value, so two consecutive 170s become one range.
      expect(ranges.get(170)).toHaveLength(1);
      // 70 and 100 are single days, so one range each.
      expect(ranges.get(70)).toHaveLength(1);
      expect(ranges.get(100)).toHaveLength(1);

      // Check the 170 range: from day1 to day2 (01.01.2026 to 02.01.2026)
      const dateRanges170 = ranges.get(170)!;
      expect(dateRanges170[0].startDate).toBe("01.01.2026");
      expect(dateRanges170[0].endDate).toBe("02.01.2026");

      // Check the 70 range: day3 (03.01.2026)
      const dateRanges70 = ranges.get(70)!;
      expect(dateRanges70[0].startDate).toBe("03.01.2026");
      expect(dateRanges70[0].endDate).toBe("03.01.2026");

      // Check the 100 range: day4 (04.01.2026)
      const dateRanges100 = ranges.get(100)!;
      expect(dateRanges100[0].startDate).toBe("04.01.2026");
      expect(dateRanges100[0].endDate).toBe("04.01.2026");
    });

    it("returns empty map when no payroll values", () => {
      const row = makeRow([null, null, null]);
      const ranges = resolver.extractRangesFromRawPayrollItem(row, 3, "01.2026");

      expect(ranges.size).toBe(0);
    });
  });

  describe("resolve", () => {
    it("aggregates payrolls and payrollsByServiceman for single row", () => {
      const row = makeRow([30, 30, null], { taxPayerId: "123" });

      const { payrolls, payrollsByServiceman } = resolver.resolve([row], "01.2026");

      // payrolls map
      expect(payrolls.get(30)).toHaveLength(1);
      expect(payrolls.get(30)![0].serviceman.fullName.toString()).toBe("JOHN Doe");

      // payrollsByServiceman map
      expect(payrollsByServiceman.get("123")).toHaveLength(1);
      // @ts-ignore
      expect(payrollsByServiceman.get("123")![0].dateRanges[0].startDate).toBe("01.01.2026");
    });

    it("handles multiple rows and combines payrolls correctly", () => {
      const row1 = makeRow([30, 50], { taxPayerId: "123" });
      const row2 = makeRow([30, 30], { fullName: "Jane Smith", taxPayerId: "456" });

      const { payrolls, payrollsByServiceman } = resolver.resolve([row1, row2], "01.2026");

      expect(payrolls.get(30)).toHaveLength(2);
      expect(payrolls.get(50)).toHaveLength(1);

      expect(payrollsByServiceman.get("123")).toHaveLength(2);
      expect(payrollsByServiceman.get("456")).toHaveLength(1);
    });

    it("not splits value 170 into 100 + 70 correctly", () => {
      // @ts-ignore
      const row = makeRow([30, 170, 170, 70, 100, 170], { taxPayerId: "123" });

      const ranges = resolver.extractRangesFromRawPayrollItem(row, 6, "01.2026");

      const dateRanges170 = ranges.get(170)!;
      const dateRanges100 = ranges.get(100)!;
      const dateRanges70 = ranges.get(70)!;
      const dateRanges30 = ranges.get(30)!;

      expect(dateRanges170).toHaveLength(2);
      expect(dateRanges100).toHaveLength(1);
      expect(dateRanges70).toHaveLength(1);
      expect(dateRanges30).toHaveLength(1);

      expect(dateRanges170[0].startDate).toBe("02.01.2026");
      expect(dateRanges170[0].endDate).toBe("03.01.2026");
      expect(dateRanges170[1].startDate).toBe("06.01.2026");
      expect(dateRanges170[1].endDate).toBe("06.01.2026");

      expect(dateRanges100[0].startDate).toBe("05.01.2026");
      expect(dateRanges100[0].endDate).toBe("05.01.2026");

      expect(dateRanges70[0].startDate).toBe("04.01.2026");
      expect(dateRanges70[0].endDate).toBe("04.01.2026");

      expect(dateRanges30[0].startDate).toBe("01.01.2026");
      expect(dateRanges30[0].endDate).toBe("01.01.2026");
    });

    it("handles nulls correctly and does not create ranges", () => {
      const row = makeRow([null, null, 30], { taxPayerId: "123" });

      const { payrollsByServiceman } = resolver.resolve([row], "01.2026");

      // @ts-ignore
      const ranges = payrollsByServiceman.get("123")![0].dateRanges;
      expect(ranges).toHaveLength(1);
      expect(ranges[0].startDate).toBe("03.01.2026");
      expect(ranges[0].endDate).toBe("03.01.2026");
    });
  });
});
