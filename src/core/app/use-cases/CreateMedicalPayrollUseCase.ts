import {
  RawPayrollReportItemData,
  PayrollRenderItem,
  DateRange,
  Serviceman,
  PayrollItem,
} from "../../domain";
import { ITableRenderer, ITableReader } from "../ports";
import { UseCaseResult } from "./UseCaseResult";
import { RawMedicalDataValidator } from "./validation/RawMedicalDataValidation";
import { handleError } from "./ErrorHandler";

export class CreateMedicalPayrollUseCase {
  constructor(
    private tableReader: ITableReader<RawPayrollReportItemData>,
    private tableRenderer: ITableRenderer<PayrollRenderItem>
  ) {}

  async execute(): Promise<UseCaseResult> {
    return handleError(async () => {
      const rawData = await this.tableReader.read();

      const validData = this.filterValidRecords(rawData);
      const filledData = this.fillMissingInfo(validData);
      const medicalPayrollItems = this.parseDateRanges(filledData);
      const renderItems = medicalPayrollItems.map((item) => item.getRenderItem());

      await this.tableRenderer.render(renderItems);

      return UseCaseResult.Ok();
    });
  }

  private filterValidRecords(data: RawPayrollReportItemData[]): RawPayrollReportItemData[] {
    return RawMedicalDataValidator.parse(
      data.filter((item) => {
        if (item.dates && item?.fullName && !item?.militaryRank) {
          console.log("Missing military rank:", item);
        }
        return !!item.dates || !!item?.fullName || !!item?.militaryRank;
      })
    );
  }

  private fillMissingInfo(data: RawPayrollReportItemData[]): RawPayrollReportItemData[] {
    return data.map((item, index) => {
      if (item.fullName) {
        return item;
      }

      let previousIndex = index - 1;
      while (previousIndex >= 0 && !data[previousIndex].fullName) {
        previousIndex--;
      }

      if (previousIndex < 0) {
        throw new Error(`No serviceman found for record at index ${index}`);
      }

      return {
        ...data[previousIndex],
        dates: item.dates,
      };
    });
  }

  private parseDateRanges(data: RawPayrollReportItemData[]): PayrollItem[] {
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
            acc.push(PayrollItem.Create(item.serviceman, [item.dateRange]));
          }

          return acc;
        }, [])
        // sort by serviceman
        .sort((a, b) =>
          a.serviceman.fullName.toString().localeCompare(b.serviceman.fullName.toString())
        )
    );
  }
}
