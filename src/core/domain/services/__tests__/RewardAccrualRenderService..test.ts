import { RewardAccrualRenderService } from "../RewardAccrualReportingService";
import { RewardAccrual, PayrollItem, Serviceman } from "../../entities";
import { v4 as uuidv4 } from "uuid";
import { makePayrollItem, makeServiceman } from "./helpers";
import { DateRange } from "../../value-objects";

// Mock uuid so tests are predictable
jest.mock("uuid", () => ({ v4: () => "uuid-mock" }));

describe("RewardAccrualRenderService", () => {
  const year = 2026;

  const serviceman: Serviceman = makeServiceman("s1", "John Doe");

  const payrollItem1: PayrollItem = makePayrollItem(
    serviceman,
    DateRange.FromString("01.01.2026-05.01.2026"),
    70,
    "Service"
  );
  const payrollItem2: PayrollItem = makePayrollItem(
    serviceman,
    DateRange.FromString("06.01.2026-08.01.2026"),
    70,
    "Overtime"
  );

  const rewardAccrual: RewardAccrual = new RewardAccrual(
    "r1",
    "s1",
    [],
    30,
    [
      { name: "Order1", year: 2026 },
      { name: "Order2", year: 2025 },
    ],
    0
  );

  const servicemansMap = new Map<string, Serviceman>([["s1", serviceman]]);
  const payrollItemsMap = new Map<string, PayrollItem[]>([["s1", [payrollItem1, payrollItem2]]]);

  describe("generate", () => {
    it("should generate RewardAccrualRenderItem with correct aggregated data", () => {
      const result = RewardAccrualRenderService.generate(
        servicemansMap,
        payrollItemsMap,
        [rewardAccrual],
        year
      );

      expect(result).toHaveLength(1);
      const item = result[0];

      expect(item.fullName).toBe("JOHN Doe");
      expect(item.militaryRank).toBe("soldier");
      expect(item.taxPayerId).toBe("s1");
      expect(item.unit).toBe("1 BOP");

      // Payroll aggregation
      expect(item.januaryDays).toBe(8); // 5 + 3
      expect(item.januaryReason).toBe("Service; Overtime");

      // Payment orders
      expect(item.numberOfPaymentOrders).toBe(2);
      expect(item.numberOfPaymentOrdersInTheYear).toBe(1); // only Order1 is for 2026
      expect(item.paymentOrders).toBe("Order1; Order2");

      // Remaining days
      expect(item.remainingDays).toBe(rewardAccrual.getRemainingDays());
      expect(item.totalEligibleDays).toBe(30);
      expect(item.initialAmountOfDays).toBe(0);
    });

    it("should handle missing payroll items gracefully", () => {
      const result = RewardAccrualRenderService.generate(
        servicemansMap,
        new Map(), // no payroll items
        [rewardAccrual],
        year
      );

      const item = result[0];

      expect(item.januaryDays).toBeUndefined();
      expect(item.januaryReason).toBeUndefined();
    });

    it("should handle missing serviceman gracefully", () => {
      const result = RewardAccrualRenderService.generate(
        new Map(), // no serviceman
        payrollItemsMap,
        [rewardAccrual],
        year
      );

      const item = result[0];

      expect(item.fullName).toBeUndefined();
      expect(item.militaryRank).toBeUndefined();
      expect(item.taxPayerId).toBeUndefined();
      expect(item.unit).toBeUndefined();
    });
  });

  describe("generatePayrollRenderItems", () => {
    const month = "01.2026";
    const createRewardAccrualWithRemainingDays = (remainingDays: number) =>
      new RewardAccrual(
        "r1",
        "s1",
        [],
        remainingDays,
        [
          { name: "Order1", year: 2026 },
          { name: "Order2", year: 2025 },
        ],
        0
      );
    const rewardAccrual: RewardAccrual = createRewardAccrualWithRemainingDays(91);

    it("should generate PayrollRenderItem for accruals with remaining periods", () => {
      const result = RewardAccrualRenderService.generatePayrollRenderItems(
        servicemansMap,
        payrollItemsMap,
        [rewardAccrual],
        month
      );

      expect(result).toHaveLength(1);
      const item = result[0];

      expect(item.fullName).toBe("JOHN Doe");
      expect(item.militaryRank).toBe("soldier");
      expect(item.taxPayerId).toBe("s1");
      expect(item.unit).toBe("1 BOP");

      // days = remaining periods
      expect(item.days).toBe(2);

      // Payroll aggregation for the month
      expect(item.reason).toBe("Service; Overtime");
    });

    it("should count periods correctly", () => {
      const firstResult = RewardAccrualRenderService.generatePayrollRenderItems(
        servicemansMap,
        payrollItemsMap,
        [createRewardAccrualWithRemainingDays(61)],
        month
      );
      const secondResult = RewardAccrualRenderService.generatePayrollRenderItems(
        servicemansMap,
        payrollItemsMap,
        [createRewardAccrualWithRemainingDays(250)],
        month
      );

      const firstItem = firstResult[0];
      expect(firstItem.days).toBe(1);
      const secondItem = secondResult[0];
      expect(secondItem.days).toBe(7);
    });

    it("should skip accruals with zero remaining periods", () => {
      const zeroRemainingAccrual = new RewardAccrual(
        "r2",
        "s1",
        [],
        30,
        [
          { name: "Order1", year: 2026 },
          { name: "Order2", year: 2026 },
        ],
        0
      );

      const result = RewardAccrualRenderService.generatePayrollRenderItems(
        servicemansMap,
        payrollItemsMap,
        [zeroRemainingAccrual],
        month
      );

      expect(result).toHaveLength(0);
    });

    it("should handle missing payroll items gracefully", () => {
      const result = RewardAccrualRenderService.generatePayrollRenderItems(
        servicemansMap,
        new Map(), // no payroll items
        [rewardAccrual],
        month
      );

      const item = result[0];
      expect(item.reason).toBe("");
      expect(item.dateRange).toBe("");
    });

    it("should handle missing serviceman gracefully", () => {
      const result = RewardAccrualRenderService.generatePayrollRenderItems(
        new Map(), // no serviceman
        payrollItemsMap,
        [rewardAccrual],
        month
      );

      const item = result[0];
      expect(item.fullName).toBeUndefined();
      expect(item.militaryRank).toBeUndefined();
      expect(item.taxPayerId).toBeUndefined();
      expect(item.unit).toBeUndefined();

      // Payroll aggregation still works
      expect(item.reason).toBe("Service; Overtime");
    });
  });
});
