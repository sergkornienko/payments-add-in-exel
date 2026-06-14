import { PaymentOrder, createPaymentOrdersFromString } from "../value-objects";
import { PayrollItem } from "./PayrollItem";
import { v4 as uuidv4 } from "uuid";

const DAYS_PER_REWARD_PERIOD = 30;
const SKIP_ORDER_PHRASE = "відміна";

export class RewardAccrual {
  static Create(
    servicemanId: string,
    payrolls: PayrollItem[],
    orders: string,
    initialAmountOfDays: number
  ): RewardAccrual {
    let daysFromPayrolls = 0;
    const payrollItems = payrolls.map((p) => {
      daysFromPayrolls += p.getTotalDays();
      return p.id;
    });
    const paymentOrders = createPaymentOrdersFromString(orders);

    return new RewardAccrual(
      uuidv4(),
      servicemanId,
      payrollItems,
      daysFromPayrolls + initialAmountOfDays,
      paymentOrders,
      initialAmountOfDays
    );
  }

  constructor(
    public readonly id: string,
    public readonly servicemanId: string,
    public readonly payrollItems: string[],
    public readonly totalEligibleDays: number,
    public readonly paymentsOrders: PaymentOrder[],
    public readonly initialAmountOfDays: number = 0
  ) {}

  getRemainingDays(): number {
    return this.totalEligibleDays - this.getPaidPeriodsInTheYear() * DAYS_PER_REWARD_PERIOD;
  }

  getPaidPeriodsInTheYear(yearToFilter = 2026) {
    return this.paymentsOrders.filter(
      ({ name, year }) => year === yearToFilter && !name.includes(SKIP_ORDER_PHRASE)
    ).length;
  }

  getRemainingPeriods() {
    return Math.floor(this.getRemainingDays() / DAYS_PER_REWARD_PERIOD);
  }
}
