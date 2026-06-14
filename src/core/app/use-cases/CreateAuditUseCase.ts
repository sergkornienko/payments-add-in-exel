import {
  DateRange,
  normalizeDay,
  PayrollItem,
  RawPayrollData,
  Serviceman,
  Document,
  FullName,
} from "../../domain";
import { ITableReader, SelectedValues, IDocumentsPopulator } from "../ports";
import { UseCaseResult } from "./UseCaseResult";
import { handleError } from "./ErrorHandler";

export class CreateAuditUseCase {
  constructor(
    private tableReader: ITableReader<RawPayrollData>,
    private documentPopulator: IDocumentsPopulator
  ) {}

  async calculatePeriod(): Promise<UseCaseResult> {
    return handleError(async () => {
      const selectedValues = await this.tableReader.getSelected();

      const sum = this.calculateSum(selectedValues);

      return UseCaseResult.Ok(sum.toFixed(2));
    });
  }

  async createParticipationCertificate(row: string): Promise<UseCaseResult> {
    const values = await this.tableReader.read();
    const rawRowData = values[Number(row) - 2];
    const dateRangesMap = this.extractDateRanges(rawRowData);

    await this.createDocument(Serviceman.FromRawExtended(rawRowData), dateRangesMap);

    return UseCaseResult.Ok();
  }

  private calculateSum({ values, header }: SelectedValues<RawPayrollData>): number {
    return values.reduce((acc, value, index) => {
      if (!value) {
        return Number(acc);
      }

      const [day, month, year] = String(header[index]).split(".");
      const daysInMonth = new Date(Number(year), Number(month), 0).getDate();
      const sum = (Number(value) * 1000) / daysInMonth;

      return Number(acc) + sum;
    }, 0) as number;
  }

  private extractDateRanges(data: RawPayrollData): Map<string, DateRange[]> {
    let dateRangesMap: Map<string, DateRange[]> = new Map();

    let periodStart = null;
    let periodEnd = null;
    const startDate = new Date(2023, 2, 27);
    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), 0);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dd = normalizeDay(d.getDate());
      const mm = normalizeDay(d.getMonth() + 1);
      const yyyy = d.getFullYear();
      const key = `${dd}.${mm}.${yyyy}`;
      const value = data[key];

      if (Number(value) !== 100 && !periodStart) {
        continue;
      }

      if (Number(value) !== 100) {
        const previousRanges = dateRangesMap.get(String(yyyy)) || [];
        dateRangesMap.set(
          String(yyyy),
          previousRanges.concat(DateRange.FromString(`${periodStart} - ${periodEnd}`))
        );
        periodStart = null;
        periodEnd = null;
        continue;
      }

      if (periodEnd && periodEnd.split(".").at(-1) !== String(yyyy)) {
        const previousRanges = dateRangesMap.get(String(yyyy - 1)) || [];
        dateRangesMap.set(
          String(yyyy - 1),
          previousRanges.concat(DateRange.FromString(`${periodStart} - ${periodEnd}`))
        );
        periodStart = key;
        periodEnd = key;
        continue;
      }

      if (!periodStart) {
        periodStart = key;
      }
      periodEnd = key;
    }

    return dateRangesMap;
  }

  private async createDocument(serviceman: Serviceman, dateRangesMap: Map<string, DateRange[]>) {
    const data = {
      "2023": "",
      "2024": "",
      "2025": "",
      "2026": "",
      currentMonth: String(new Date().getMonth() + 1).padStart(2, "0"),
      currentYear: new Date().getFullYear(),
      fullName: "",
    };

    dateRangesMap.forEach((dateRanges, year) => {
      const item = PayrollItem.Create(
        serviceman,
        DateRange.Combine(dateRanges, (a: Date, b: Date) => a.getFullYear() === b.getFullYear())
      );
      data["fullName"] = item.serviceman.fullName.toString();
      data[year] = item.getRenderItem().dateRange + "\n";
    });

    return this.documentPopulator.populate(
      Document.CreateParticipationCertificate(`Довідка участь ${data["fullName"]}`, data)
    );
  }
}
