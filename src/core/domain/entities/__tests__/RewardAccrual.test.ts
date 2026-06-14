import { RewardAccrual } from "../RewardAccrual";
import { PaymentOrder } from "../../value-objects";
import { v4 as uuidv4 } from "uuid";

// Mock uuid so tests are predictable
jest.mock("uuid", () => ({ v4: () => "uuid-mock" }));

describe("RewardAccrual", () => {
  const servicemanId = "123";
  const payrollItems: string[] = [];
  const totalEligibleDays = 90;

  it("should correctly count paid periods in a given year", () => {
    const payementsOrders: PaymentOrder[] = [
      { name: "Order 1", year: 2026 },
      { name: "Order 2", year: 2026 },
      { name: "Order 3", year: 2025 },
      { name: "Order 4 - відміна", year: 2025 },
    ];

    const accrual = new RewardAccrual(
      "1",
      servicemanId,
      payrollItems,
      totalEligibleDays,
      payementsOrders
    );

    expect(accrual.getPaidPeriodsInTheYear(2026)).toBe(2);
    expect(accrual.getPaidPeriodsInTheYear(2025)).toBe(1);
    expect(accrual.getPaidPeriodsInTheYear(2024)).toBe(0);
  });

  it("should calculate remaining days correctly based on paid periods", () => {
    const payementsOrders: PaymentOrder[] = [
      { name: "Order 1", year: 2026 },
      { name: "Order 2", year: 2026 },
    ];

    const accrual = new RewardAccrual(
      "1",
      servicemanId,
      payrollItems,
      totalEligibleDays,
      payementsOrders
    );

    // 2 periods * 30 days = 60 days paid
    // totalEligibleDays = 90
    expect(accrual.getRemainingDays()).toBe(30);
  });

  it("should return total remaining days equal to totalEligibleDays if no payments", () => {
    const payementsOrders: PaymentOrder[] = [];

    const accrual = new RewardAccrual(
      "1",
      servicemanId,
      payrollItems,
      totalEligibleDays,
      payementsOrders
    );

    expect(accrual.getRemainingDays()).toBe(90);
    expect(accrual.getPaidPeriodsInTheYear(2026)).toBe(0);
  });

  it("should correctly handle remainingDaysFromPreviousYear (if included in totalEligibleDays)", () => {
    const payementsOrders: PaymentOrder[] = [{ name: "Order 1", year: 2026 }];

    const accrual = new RewardAccrual(
      "1",
      servicemanId,
      payrollItems,
      totalEligibleDays,
      payementsOrders,
      20
    );

    // currently getRemainingDays() uses only totalEligibleDays and paid periods,
    // so remainingDaysFromPreviousYear does not change the result
    expect(accrual.getRemainingDays()).toBe(60);
  });
});
