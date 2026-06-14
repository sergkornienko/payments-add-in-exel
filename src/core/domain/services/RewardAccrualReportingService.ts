import { RewardAccrual, PayrollItem, Serviceman } from "../entities";
import { PayrollRenderItem, RewardAccrualRenderItem } from "../value-objects";

export class RewardAccrualRenderService {
  static generate(
    servicemansMap: Map<string, Serviceman>,
    payrollItemsMap: Map<string, PayrollItem[]>,
    rewardAccruals: RewardAccrual[],
    year: number = new Date().getFullYear()
  ): RewardAccrualRenderItem[] {
    return rewardAccruals.map((accrual, index) => {
      const serviceman = servicemansMap.get(accrual.servicemanId);

      const payrollItems = payrollItemsMap.get(accrual.servicemanId) ?? [];
      const monthlyData: Record<string, { days: number; reason?: string }> = {};
      payrollItems.forEach((item) => {
        const monthName = item.getMonthAndYear();
        const previousDays = monthlyData[monthName]?.days || 0;
        const previousReasons = monthlyData[monthName]?.reason
          ? [monthlyData[monthName]?.reason]
          : [];

        monthlyData[monthName] = {
          days: previousDays + item.getTotalDays(),
          reason: [...previousReasons, item.reason].join("; "),
        };
      });

      const numberOfPaymentOrders = accrual.paymentsOrders.length;
      const paymentOrders = accrual.paymentsOrders.map((item) => item.name).join("; ");
      const numberOfPaymentOrdersInTheYear = accrual.paymentsOrders.filter(
        (item) => item.year === year
      ).length;

      return {
        index: index + 1,
        fullName: serviceman?.fullName.toString(),
        militaryRank: serviceman?.militaryRank,
        taxPayerId: serviceman?.taxPayerId,
        position: serviceman?.position,
        unit: serviceman?.unit,
        remainingDays: accrual.getRemainingDays(),
        totalEligibleDays: accrual.totalEligibleDays,
        initialAmountOfDays: accrual.initialAmountOfDays,
        numberOfPaymentOrdersInTheYear,
        numberOfPaymentOrders,
        paymentOrders,
        januaryDays: monthlyData[`01.${year}`]?.days,
        januaryReason: monthlyData[`01.${year}`]?.reason,
        februaryDays: monthlyData[`02.${year}`]?.days,
        februaryReason: monthlyData[`02.${year}`]?.reason,
        marchDays: monthlyData[`03.${year}`]?.days,
        marchReason: monthlyData[`03.${year}`]?.reason,
        aprilDays: monthlyData[`04.${year}`]?.days,
        aprilReason: monthlyData[`04.${year}`]?.reason,
        mayDays: monthlyData[`05.${year}`]?.days,
        mayReason: monthlyData[`05.${year}`]?.reason,
        juneDays: monthlyData[`06.${year}`]?.days,
        juneReason: monthlyData[`06.${year}`]?.reason,
        julyDays: monthlyData[`07.${year}`]?.days,
        julyReason: monthlyData[`07.${year}`]?.reason,
        augustDays: monthlyData[`08.${year}`]?.days,
        augustReason: monthlyData[`08.${year}`]?.reason,
        septemberDays: monthlyData[`09.${year}`]?.days,
        septemberReason: monthlyData[`09.${year}`]?.reason,
        octoberDays: monthlyData[`10.${year}`]?.days,
        octoberReason: monthlyData[`10.${year}`]?.reason,
        novemberDays: monthlyData[`11.${year}`]?.days,
        novemberReason: monthlyData[`11.${year}`]?.reason,
        decemberDays: monthlyData[`12.${year}`]?.days,
        decemberReason: monthlyData[`12.${year}`]?.reason,
      };
    });
  }

  static generatePayrollRenderItems(
    servicemansMap: Map<string, Serviceman>,
    payrollItemsMap: Map<string, PayrollItem[]>,
    rewardAccruals: RewardAccrual[],
    monthAndYear: string
  ): PayrollRenderItem[] {
    const filteredAccurals = rewardAccruals.filter((accrual) => accrual.getRemainingPeriods() > 0);

    return filteredAccurals.map((accrual) => {
      const serviceman = servicemansMap.get(accrual.servicemanId);
      const payrollItems = payrollItemsMap.get(accrual.servicemanId) ?? [];
      const reason = payrollItems
        .filter((item) => item.getMonthAndYear() === monthAndYear)
        .map((item) => item.reason)
        .join("; ");
      const dateRange = payrollItems.flatMap((item) => item.getDates()).join("; ");

      return {
        fullName: serviceman?.fullName.toString(),
        militaryRank: serviceman?.militaryRank,
        taxPayerId: serviceman?.taxPayerId,
        unit: serviceman?.unit,
        days: accrual.getRemainingPeriods(),
        reason,
        dateRange,
      };
    });
  }
}
