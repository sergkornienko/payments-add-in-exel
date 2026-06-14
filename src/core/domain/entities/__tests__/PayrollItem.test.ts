import { PayrollItem } from "../PayrollItem";
import { DateRange, FullName } from "../../value-objects";
import { Serviceman } from "../Serviceman";
import { v4 as uuidv4 } from "uuid";

// Mock uuid so tests are predictable
jest.mock("uuid", () => ({ v4: () => "uuid-mock" }));

class MockServiceman implements Serviceman {
  id = "123";
  fullName = new FullName("John Doe");
  militaryRank = "Sergeant";
  taxPayerId = "some-id";
  unit = "bla";
  equals(other: Serviceman): boolean {
    return this.id === other.id;
  }
}

// Minimal DateRange mock
class MockDateRange extends DateRange {
  constructor(
    public startDate: string,
    public endDate: string
  ) {
    super(startDate, endDate);
  }
  getMonthAndYear() {
    return this.startDate.substring(3); // mm.yyyy
  }
  toString() {
    return `${this.startDate} - ${this.endDate}`;
  }
}

describe("PayrollItem", () => {
  let serviceman: Serviceman;
  let dateRange: DateRange;

  beforeEach(() => {
    serviceman = new MockServiceman();
    dateRange = new MockDateRange("01.01.2024", "03.01.2024");
  });

  describe("Create", () => {
    it("should create a PayrollItem with uuid, serviceman, and dateRange", () => {
      const item = PayrollItem.Create(serviceman, [dateRange]);

      expect(item).toBeInstanceOf(PayrollItem);
      expect(item.serviceman).toBe(serviceman);
      expect(item.getMonthAndYear()).toBe("01.2024");
    });
  });

  describe("getTotalDays", () => {
    it("should return 3 initially", () => {
      const item = new PayrollItem("id", serviceman, [dateRange], 100);
      expect(item.getTotalDays()).toBe(3);
    });

    it("should still return 6 after adding a dateRange", () => {
      const item = new PayrollItem("id", serviceman, [dateRange], 100);
      const newRange = new MockDateRange("05.01.2024", "07.01.2024");
      item.addDateRange(newRange);

      expect(item.getTotalDays()).toBe(6);
    });
  });

  describe("getMonth", () => {
    it("should return the month of the first dateRange", () => {
      const item = new PayrollItem("id", serviceman, [dateRange], 100);
      expect(item.getMonthAndYear()).toBe("01.2024");
    });
  });

  describe("getRenderItem", () => {
    it("should return an object with fullName, militaryRank, dateRange, and days", () => {
      const item = new PayrollItem("id", serviceman, [dateRange], 100);
      const renderItem = item.getRenderItem();

      expect(renderItem.fullName).toBe("JOHN Doe");
      expect(renderItem.militaryRank).toBe("Sergeant");
      expect(renderItem.unit).toBe("bla");
      expect(renderItem.taxPayerId).toBe("some-id");
      expect(renderItem.dateRange).toBe("01.01.2024 - 03.01.2024");
      expect(renderItem.days).toBe(3);
      // @ts-ignore access private payrollDays
      const days = Object.keys(item["payrollDays"]);
      expect(days).toEqual(["01.01.2024", "02.01.2024", "03.01.2024"]);
    });
  });

  describe("addDateRange", () => {
    it("should add a new DateRange to dateRanges array", () => {
      const item = new PayrollItem("id", serviceman, [dateRange], 100);
      const newRange = new MockDateRange("05.01.2024", "07.01.2024");
      item.addDateRange(newRange);

      // Access private dateRanges for test
      // @ts-ignore
      expect(item["dateRanges"]).toContain(newRange);
    });

    it("should combine DateRangeі if they in the same period", () => {
      const item = new PayrollItem("id", serviceman, [dateRange], 100);
      const newRange = new MockDateRange("04.01.2024", "07.01.2024");
      item.addDateRange(newRange);

      // Access private dateRanges for test
      // @ts-ignore
      expect(item["dateRanges"]).toHaveLength(1);
      expect(item["dateRanges"]).toEqual([new MockDateRange("01.01.2024", "07.01.2024")]);
    });
  });

  describe("calculatePayrollDays", () => {
    it("should populate payrollDays for each day in the dateRanges", () => {
      const item = new PayrollItem(
        "id",
        serviceman,
        [new MockDateRange("01.01.2024", "03.01.2024")],
        100
      );

      // @ts-ignore access private payrollDays
      const days = Object.keys(item["payrollDays"]);
      expect(days).toEqual(["01.01.2024", "02.01.2024", "03.01.2024"]);
      expect(item.getTotalDays()).toBe(3);
    });

    it("should update payrollDays when a new dateRange is added", () => {
      const item = new PayrollItem(
        "id",
        serviceman,
        [new MockDateRange("01.01.2024", "03.01.2024")],
        100
      );

      item.addDateRange(new MockDateRange("05.01.2024", "06.01.2024"));

      // @ts-ignore access private payrollDays
      const days = Object.keys(item["payrollDays"]);
      expect(days).toEqual(["01.01.2024", "02.01.2024", "03.01.2024", "05.01.2024", "06.01.2024"]);
      expect(item.getTotalDays()).toBe(5);
    });
  });
});
