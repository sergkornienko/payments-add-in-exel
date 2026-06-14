import { DateRange } from "../DateRange";

describe("DateRange", () => {
  describe("FromInstructorsString", () => {
    it("should parse single day", () => {
      const input = "05 (2)";
      const month = "01.2024";

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toHaveLength(1);
      expect(result[0].startDate).toBe("05.01.2024");
      expect(result[0].endDate).toBe("05.01.2024");
    });

    it("should parse consecutive days into single range", () => {
      const input = "05 (2), 06 (3), 07 (2)";
      const month = "01.2024";

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toHaveLength(1);
      expect(result[0].startDate).toBe("05.01.2024");
      expect(result[0].endDate).toBe("07.01.2024");
    });

    it("should parse non-consecutive days into separate ranges", () => {
      const input = "05 (2), 06 (3), 10 (3)";
      const month = "01.2024";

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toHaveLength(2);
      expect(result[0].startDate).toBe("05.01.2024");
      expect(result[0].endDate).toBe("06.01.2024");
      expect(result[1].startDate).toBe("10.01.2024");
      expect(result[1].endDate).toBe("10.01.2024");
    });

    it("should parse complex input with multiple ranges", () => {
      const input = "05 (2), 06 (3), 07 (2), 08 (3), 10 (3), 12 (2), 13 (1), 14 (1)";
      const month = "01.2024";

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toHaveLength(3);

      // Range 1: 05-08
      expect(result[0].startDate).toBe("05.01.2024");
      expect(result[0].endDate).toBe("08.01.2024");

      // Range 2: 10
      expect(result[1].startDate).toBe("10.01.2024");
      expect(result[1].endDate).toBe("10.01.2024");

      // Range 3: 12-14
      expect(result[2].startDate).toBe("12.01.2024");
      expect(result[2].endDate).toBe("14.01.2024");
    });

    it("should parse full example from requirements", () => {
      const input =
        "05 (2), 06 (3), 07 (2), 08 (3), 10 (3), 12 (2), 13 (1), 14 (1), 15 (8), 17 (8), 18 (8), 19 (4), 20 (4), 21 (4), 22 (1), 24 (8), 25 (3), 26 (4), 27 (8), 28 (4), 29 (4)";
      const month = "01.2024";

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toHaveLength(5);

      expect(result[0]).toEqual(new DateRange("05.01.2024", "08.01.2024"));
      expect(result[1]).toEqual(new DateRange("10.01.2024", "10.01.2024"));
      expect(result[2]).toEqual(new DateRange("12.01.2024", "15.01.2024"));
      expect(result[3]).toEqual(new DateRange("17.01.2024", "22.01.2024"));
      expect(result[4]).toEqual(new DateRange("24.01.2024", "29.01.2024"));
    });

    it("should handle unsorted days", () => {
      const input = "10 (3), 05 (2), 07 (2), 06 (3)";
      const month = "01.2024";

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toHaveLength(2);
      expect(result[0].startDate).toBe("05.01.2024");
      expect(result[0].endDate).toBe("07.01.2024");
      expect(result[1].startDate).toBe("10.01.2024");
      expect(result[1].endDate).toBe("10.01.2024");
    });

    it("should ignore invalid days", () => {
      const input = "05 (2), abc, 06 (3), 99 (1)";
      const month = "01.2024";

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toHaveLength(1);
      expect(result[0].startDate).toBe("05.01.2024");
      expect(result[0].endDate).toBe("06.01.2024");
    });

    it("should handle days without parentheses", () => {
      const input = "05, 06, 07";
      const month = "01.2024";

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toHaveLength(1);
      expect(result[0].startDate).toBe("05.01.2024");
      expect(result[0].endDate).toBe("07.01.2024");
    });

    it("should pad single digit days with zero", () => {
      const input = "1 (2), 2 (3), 3 (1)";
      const month = "01.2024";

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toHaveLength(1);
      expect(result[0].startDate).toBe("01.01.2024");
      expect(result[0].endDate).toBe("03.01.2024");
    });

    it("should return empty array for empty input", () => {
      const result = DateRange.FromInstructorsString("", "01.2024");

      expect(result).toEqual([]);
    });

    it("should return empty array for input with only parentheses", () => {
      const input = "(2), (3), (1)";
      const month = "01.2024";

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toEqual([]);
    });

    it("should throw error for invalid month format", () => {
      const input = "05 (2)";

      expect(() => DateRange.FromInstructorsString(input, "invalid")).toThrow(
        "Invalid month format. Expected MM.YYYY"
      );
      expect(() => DateRange.FromInstructorsString(input, "1.2024")).toThrow(
        "Invalid month format. Expected MM.YYYY"
      );
      expect(() => DateRange.FromInstructorsString(input, "01/2024")).toThrow(
        "Invalid month format. Expected MM.YYYY"
      );
    });

    it("should handle duplicate days", () => {
      const input = "05 (2), 05 (3), 06 (1)";
      const month = "01.2024";

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toHaveLength(1);
      expect(result[0].startDate).toBe("05.01.2024");
      expect(result[0].endDate).toBe("06.01.2024");
    });

    it("should handle extra whitespace", () => {
      const input = "  05  (2)  ,   06   (3)  ,  07  (2)  ";
      const month = "01.2024";

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toHaveLength(1);
      expect(result[0].startDate).toBe("05.01.2024");
      expect(result[0].endDate).toBe("07.01.2024");
    });

    it("should work with different months", () => {
      const input = "28 (1), 29 (1), 30 (1), 31 (1)";
      const month = "12.2024";

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toHaveLength(1);
      expect(result[0].startDate).toBe("28.12.2024");
      expect(result[0].endDate).toBe("31.12.2024");
    });

    it("should handle February correctly", () => {
      const input = "27 (1), 28 (1), 29 (1)";
      const month = "02.2024"; // Leap year

      const result = DateRange.FromInstructorsString(input, month);

      expect(result).toHaveLength(1);
      expect(result[0].startDate).toBe("27.02.2024");
      expect(result[0].endDate).toBe("29.02.2024");
    });
  });

  describe("constructor", () => {
    it("should create a valid date range", () => {
      const range = new DateRange("01.01.2024", "15.01.2024");

      expect(range.startDate).toBe("01.01.2024");
      expect(range.endDate).toBe("15.01.2024");
    });

    it("should throw error for invalid date format", () => {
      expect(() => new DateRange("invalid", "15.01.2024")).toThrow("Invalid date format");
    });
  });

  describe("isSingleDay", () => {
    it("should return true when start and end dates are the same", () => {
      const range = new DateRange("01.01.2024", "01.01.2024");

      expect(range.isSingleDay()).toBe(true);
    });

    it("should return false when dates are different", () => {
      const range = new DateRange("01.01.2024", "15.01.2024");

      expect(range.isSingleDay()).toBe(false);
    });
  });

  describe("Combine", () => {
    it("should combine continuous ranges in the same month", () => {
      const input = [
        new DateRange("03.03.2025", "13.03.2025"),
        new DateRange("14.03.2025", "23.03.2025"),
      ];

      const result = DateRange.Combine(input);

      expect(result).toEqual([new DateRange("03.03.2025", "23.03.2025")]);
    });

    it("should not combine ranges from different months", () => {
      const input = [
        new DateRange("03.03.2025", "13.03.2025"),
        new DateRange("14.04.2025", "23.04.2025"),
      ];

      const result = DateRange.Combine(input);

      expect(result).toHaveLength(2);
    });

    it("should remove ranges fully covered by another", () => {
      const input = [
        new DateRange("01.03.2025", "31.03.2025"),
        new DateRange("10.03.2025", "15.03.2025"),
      ];

      const result = DateRange.Combine(input);

      expect(result).toEqual([new DateRange("01.03.2025", "31.03.2025")]);
    });

    it("should merge overlapping ranges in same month", () => {
      const input = [
        new DateRange("01.03.2025", "15.03.2025"),
        new DateRange("10.03.2025", "20.03.2025"),
      ];

      const result = DateRange.Combine(input);

      expect(result).toEqual([new DateRange("01.03.2025", "20.03.2025")]);
    });

    it("should handle mixed example correctly", () => {
      const input = [
        new DateRange("03.03.2025", "13.03.2025"),
        new DateRange("14.03.2025", "23.03.2025"),
        new DateRange("14.04.2025", "23.04.2025"),
      ];

      const result = DateRange.Combine(input);

      expect(result).toEqual([
        new DateRange("03.03.2025", "23.03.2025"),
        new DateRange("14.04.2025", "23.04.2025"),
      ]);
    });

    it("should work regardless of input order", () => {
      const input = [
        new DateRange("14.03.2025", "23.03.2025"),
        new DateRange("03.03.2025", "13.03.2025"),
      ];

      const result = DateRange.Combine(input);

      expect(result).toEqual([new DateRange("03.03.2025", "23.03.2025")]);
    });
  });

  describe("toString", () => {
    it("should return single date for same start and end", () => {
      const range = new DateRange("01.01.2024", "01.01.2024");

      expect(range.toString()).toBe("за 01.01.2024");
    });

    it("should return range format for different dates", () => {
      const range = new DateRange("01.01.2024", "15.01.2024");

      expect(range.toString()).toBe("з 01.01.2024 по 15.01.2024");
    });
  });

  describe("getMonth", () => {
    it('should return month and year in "mm.yyyy" format', () => {
      const dr = new DateRange("01.02.2024", "10.02.2024");
      expect(dr.getMonthAndYear()).toBe("02.2024");
    });

    it("should trim leading/trailing spaces", () => {
      const dr = new DateRange(" 05.03.2025  ", "15.03.2025");
      expect(dr.getMonthAndYear()).toBe("03.2025");
    });

    it("should handle single-digit months with leading zero", () => {
      const dr = new DateRange("07.04.2023", "20.04.2023");
      expect(dr.getMonthAndYear()).toBe("04.2023");
    });

    it("should work for end-of-year month", () => {
      const dr = new DateRange("31.12.2022", "31.12.2022");
      expect(dr.getMonthAndYear()).toBe("12.2022");
    });

    it("should not be affected by extra spaces inside the date string", () => {
      const dr = new DateRange("  15.05.2021  ", "15.05.2021");
      expect(dr.getMonthAndYear()).toBe("05.2021");
    });
  });

  describe("FromString", () => {
    it('should return a single DateRange for a single date "dd.mm.yyyy"', () => {
      const ranges = DateRange.FromString("15.03.2024");
      expect(ranges.length).toBe(1);
      expect(ranges[0].startDate).toBe("15.03.2024");
      expect(ranges[0].endDate).toBe("15.03.2024");
    });

    it('should parse a dash range "dd.mm.yyyy - dd.mm.yyyy"', () => {
      const ranges = DateRange.FromString("01.03.2024 - 05.03.2024");
      expect(ranges.length).toBe(1);
      expect(ranges[0].startDate).toBe("01.03.2024");
      expect(ranges[0].endDate).toBe("05.03.2024");
    });

    it('should parse "з dd.mm.yyyy по dd.mm.yyyy" format', () => {
      const ranges = DateRange.FromString("з 01.04.2024 по 03.04.2024");
      expect(ranges.length).toBe(1);
      expect(ranges[0].startDate).toBe("01.04.2024");
      expect(ranges[0].endDate).toBe("03.04.2024");
    });

    it("should split ranges that cross months into separate DateRanges", () => {
      const ranges = DateRange.FromString("28.01.2024 - 03.02.2024");
      expect(ranges.length).toBe(2);

      expect(ranges[0].startDate).toBe("28.01.2024");
      expect(ranges[0].endDate).toBe("31.01.2024");

      expect(ranges[1].startDate).toBe("01.02.2024");
      expect(ranges[1].endDate).toBe("03.02.2024");
    });

    it("should parse multiple comma-separated ranges", () => {
      const ranges = DateRange.FromString(
        "з 01.01.2024 по 03.01.2024, за 15.01.2024, 20.01.2024 - 22.01.2024"
      );
      expect(ranges.length).toBe(3);

      expect(ranges[0].startDate).toBe("01.01.2024");
      expect(ranges[0].endDate).toBe("03.01.2024");

      expect(ranges[1].startDate).toBe("15.01.2024");
      expect(ranges[1].endDate).toBe("15.01.2024");

      expect(ranges[2].startDate).toBe("20.01.2024");
      expect(ranges[2].endDate).toBe("22.01.2024");
    });

    it("should parse multiple ranges", () => {
      const ranges = DateRange.FromString(
        "з 01.01.2026 по 04.01.2026; за 11.01.2026; з 16.01.2026 по 27.01.2026"
      );
      expect(ranges.length).toBe(3);

      expect(ranges[0].startDate).toBe("01.01.2026");
      expect(ranges[0].endDate).toBe("04.01.2026");

      expect(ranges[1].startDate).toBe("11.01.2026");
      expect(ranges[1].endDate).toBe("11.01.2026");

      expect(ranges[2].startDate).toBe("16.01.2026");
      expect(ranges[2].endDate).toBe("27.01.2026");
    });

    it("should parse multiple comma-separated ranges", () => {
      const ranges = DateRange.FromString(
        "з 01.01.2024 по 03.01.2024, за 15.01.2024, 20.01.2024 - 22.01.2024, за 26.01.2024, 28.01.2024 - 29.01.2024"
      );
      expect(ranges.length).toBe(5);

      expect(ranges[0].startDate).toBe("01.01.2024");
      expect(ranges[0].endDate).toBe("03.01.2024");

      expect(ranges[1].startDate).toBe("15.01.2024");
      expect(ranges[1].endDate).toBe("15.01.2024");

      expect(ranges[2].startDate).toBe("20.01.2024");
      expect(ranges[2].endDate).toBe("22.01.2024");

      expect(ranges[3].startDate).toBe("26.01.2024");
      expect(ranges[3].endDate).toBe("26.01.2024");

      expect(ranges[4].startDate).toBe("28.01.2024");
      expect(ranges[4].endDate).toBe("29.01.2024");
    });

    it("should throw an error for invalid dates", () => {
      expect(() => DateRange.FromString("32.01.2024")).toThrow("Invalid calendar date: 32.01.2024");
      expect(() => DateRange.FromString("з 01.01.2024 по 31.02.2024")).toThrow(
        "Invalid calendar date: 31.02.2024"
      );
    });

    it("should handle trimming and semicolon-separated values", () => {
      const ranges = DateRange.FromString(" 01.03.2024 ; 05.03.2024 ");
      expect(ranges.length).toBe(2);
      expect(ranges[0].startDate).toBe("01.03.2024");
      expect(ranges[1].startDate).toBe("05.03.2024");
    });
  });
});
