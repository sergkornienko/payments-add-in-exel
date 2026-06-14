import { PayrollItem } from "../../entities";
import { ComparisonDifference, DateRange } from "../../value-objects";
import { PayrollAnalysisService } from "../PayrollAnalysisService";
import { v4 as uuidv4 } from "uuid";
import { makePayrollItem, makeServiceman } from "./helpers";

// Mock uuid so tests are predictable
jest.mock("uuid", () => ({ v4: () => "uuid-mock" }));

describe("PayrollAnalysisService.detectOverlaps", () => {
  describe("", () => {
    it("should return empty array when no payrolls are provided", () => {
      const result = PayrollAnalysisService.DetectOverlaps(new Map());
      expect(result).toEqual([]);
    });

    it("should return empty array when payroll items have no overlapping payrollDays", () => {
      const serviceman = makeServiceman();

      const payrollsByServiceman = new Map<string, PayrollItem[]>();
      payrollsByServiceman.set("123", [
        makePayrollItem(serviceman, DateRange.FromString("01.01.2026-02.01.2026")),
        makePayrollItem(serviceman, DateRange.FromString("03.01.2026-04.01.2026")),
      ]);

      const result = PayrollAnalysisService.DetectOverlaps(payrollsByServiceman);
      expect(result).toEqual([]);
    });

    it("should detect overlapping dates when payrollDays overlap for same serviceman", () => {
      const serviceman = makeServiceman();

      const payrollsByServiceman = new Map<string, PayrollItem[]>();
      payrollsByServiceman.set("123", [
        makePayrollItem(serviceman, DateRange.FromString("01.01.2026-03.01.2026")),
        makePayrollItem(serviceman, DateRange.FromString("02.01.2026-04.01.2026")),
      ]);

      const result = PayrollAnalysisService.DetectOverlaps(payrollsByServiceman);

      expect(result).toHaveLength(1);
      expect(result[0].serviceman).toBe(serviceman);
      expect(result[0].overlaps).toEqual(["02.01.2026", "03.01.2026"]);
    });

    it("should detect overlaps independently for multiple servicemen", () => {
      const john = makeServiceman("123", "John Doe");
      const jane = makeServiceman("456", "Jane Smith");

      const payrollsByServiceman = new Map<string, PayrollItem[]>();
      payrollsByServiceman.set("123", [
        makePayrollItem(john, DateRange.FromString("01.01.2026-02.01.2026")),
        makePayrollItem(john, DateRange.FromString("02.01.2026")),
      ]);
      payrollsByServiceman.set("456", [
        makePayrollItem(jane, DateRange.FromString("05.01.2026")),
        makePayrollItem(jane, DateRange.FromString("06.01.2026")),
      ]);

      const result = PayrollAnalysisService.DetectOverlaps(payrollsByServiceman);

      expect(result).toHaveLength(1);
      expect(result[0].serviceman.fullName.toString()).toBe("JOHN Doe");
      expect(result[0].overlaps).toEqual(["02.01.2026"]);
    });

    it("should ignore servicemen with 70 overlaping", () => {
      const serviceman = makeServiceman();

      const payrollsByServiceman = new Map<string, PayrollItem[]>();
      payrollsByServiceman.set("123", [
        makePayrollItem(serviceman, DateRange.FromString("01.01.2026-30.01.2026")),
        makePayrollItem(serviceman, DateRange.FromString("06.01.2026-12.01.2026"), 70),
      ]);

      const result = PayrollAnalysisService.DetectOverlaps(payrollsByServiceman);
      expect(result).toEqual([]);
    });

    it("should ignore servicemen with empty payroll item list", () => {
      const payrollsByServiceman = new Map<string, PayrollItem[]>();
      payrollsByServiceman.set("123", []);

      const result = PayrollAnalysisService.DetectOverlaps(payrollsByServiceman);
      expect(result).toEqual([]);
    });
  });

  describe("ComparePayrolls", () => {
    let serviceman;

    beforeEach(() => {
      serviceman = makeServiceman();
    });

    it("should return areEqual=true when payrolls are identical", () => {
      const first = [makePayrollItem(serviceman, DateRange.FromString("01.01.2026-30.01.2026"))];
      const second = [makePayrollItem(serviceman, DateRange.FromString("01.01.2026-30.01.2026"))];

      const result = PayrollAnalysisService.ComparePayrolls(first, second);

      expect(result.areEqual).toBe(true);
      expect(result.differences).toHaveLength(0);
    });

    it("should detect missing serviceman in second payroll", () => {
      const first = [makePayrollItem(serviceman, DateRange.FromString("01.01.2026-30.01.2026"))];
      const second: PayrollItem[] = [];

      const result = PayrollAnalysisService.ComparePayrolls(first, second);

      expect(result.areEqual).toBe(false);
      expect(result.differences).toHaveLength(1);

      expect(result.differences[0]).toEqual(
        ComparisonDifference.MissingServiceman("123", "JOHN Doe")
      );
    });

    it("should detect extra serviceman in second payroll", () => {
      const first: PayrollItem[] = [];
      const second = [makePayrollItem(serviceman, DateRange.FromString("01.01.2026"))];

      const result = PayrollAnalysisService.ComparePayrolls(first, second);

      expect(result.areEqual).toBe(false);
      expect(result.differences).toHaveLength(1);

      expect(result.differences[0]).toEqual(
        ComparisonDifference.ExtraServiceman("123", "JOHN Doe")
      );
    });

    it("should detect missing dates in first payroll", () => {
      const first = [makePayrollItem(serviceman, DateRange.FromString("01.01.2026"))];
      const second = [makePayrollItem(serviceman, DateRange.FromString("01.01.2026-02.01.2026"))];

      const result = PayrollAnalysisService.ComparePayrolls(first, second);

      expect(result.areEqual).toBe(false);
      expect(result.differences).toHaveLength(1);

      const diff = result.differences[0];
      expect(diff).toEqual(
        ComparisonDifference.DifferentRanges("123", "JOHN Doe", ["02.01.2026"], [])
      );
    });

    it("should detect missing dates in second payroll", () => {
      const first = [makePayrollItem(serviceman, DateRange.FromString("01.01.2026-02.01.2026"))];
      const second = [makePayrollItem(serviceman, DateRange.FromString("01.01.2026"))];

      const result = PayrollAnalysisService.ComparePayrolls(first, second);

      expect(result.areEqual).toBe(false);
      expect(result.differences).toHaveLength(1);

      const diff = result.differences[0];
      expect(diff).toEqual(
        ComparisonDifference.DifferentRanges("123", "JOHN Doe", [], ["02.01.2026"])
      );
    });

    it("should handle multiple servicemen with mixed differences", () => {
      const first = [
        makePayrollItem(serviceman, DateRange.FromString("01.01.2026")),
        makePayrollItem(makeServiceman("234", "Jane Roe"), DateRange.FromString("05.01.2026")),
      ];

      const second = [
        makePayrollItem(serviceman, DateRange.FromString("01.01.2026-02.01.2026")),
        makePayrollItem(makeServiceman("345", "Extra Guy"), DateRange.FromString("05.01.2026")),
      ];

      const result = PayrollAnalysisService.ComparePayrolls(first, second);

      expect(result.areEqual).toBe(false);
      expect(result.differences).toHaveLength(3);

      expect(result.differences).toContainEqual(
        ComparisonDifference.DifferentRanges("123", "JOHN Doe", ["02.01.2026"], [])
      );

      expect(result.differences).toContainEqual(
        ComparisonDifference.MissingServiceman("234", "JANE Roe")
      );

      expect(result.differences).toContainEqual(
        ComparisonDifference.ExtraServiceman("345", "EXTRA Guy")
      );
    });
  });
});
