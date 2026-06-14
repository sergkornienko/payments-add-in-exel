import { PayrollItem, Serviceman } from "../entities";
import { DateRange, PayrollValue, RawPayrollReportItemData } from "../value-objects";

export class PayrollParserService {
  static parseDateRanges(data: RawPayrollReportItemData[], value?: PayrollValue): PayrollItem[] {
    try {
      return (
        data
          // split all date ranges
          .flatMap((item) =>
            DateRange.FromString(item.dates!).map((dateRange) => ({
              serviceman: Serviceman.fromRaw({
                fullName: item.fullName!,
                militaryRank: item.militaryRank,
              }),
              dateRange,
            }))
          )
          .reduce((acc: PayrollItem[], item) => {
            const sameMonthMediacalPayrollItem = acc.find(
              (accItem) =>
                accItem.serviceman.equals(item.serviceman) &&
                item.dateRange.getMonthAndYear() === accItem.getMonthAndYear()
            );

            if (sameMonthMediacalPayrollItem) {
              sameMonthMediacalPayrollItem.addDateRange(item.dateRange);
            } else {
              acc.push(PayrollItem.Create(item.serviceman, [item.dateRange], value));
            }

            return acc;
          }, [])
          // sort by serviceman
          .sort((a, b) =>
            a.serviceman.fullName.toString().localeCompare(b.serviceman.fullName.toString())
          )
      );
    } catch (error) {
      console.log({
        data,
        value,
      });
      throw error;
    }
  }
}
