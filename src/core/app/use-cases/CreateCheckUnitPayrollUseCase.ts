import {
  RawPayrollData,
  PayrollPeriodResolver,
  PayrollAnalysisService,
  PayrollValue,
  PayrollItem,
  RawPayrollReportItemData,
  ComparisonDifference,
  PayrollParserService,
} from "../../domain";
import { ITableRenderer, ITableReader, IRawPayrollDataVerifier } from "../ports";
import { UseCaseResult } from "./UseCaseResult";
import { MonthStringSchema } from "./validation/RawInstructorsDataValidation";
import { handleError } from "./ErrorHandler";
import { PayrollDataValidator } from "./validation/RawPayrollData";

export class CreateCheckUnitPayrollUseCase {
  constructor(
    private payrollTableReader: ITableReader<RawPayrollData>,
    private report30TableReader: ITableReader<RawPayrollReportItemData>,
    private report50TableReader: ITableReader<RawPayrollReportItemData>,
    private report70TableReader: ITableReader<RawPayrollReportItemData>,
    private report100TableReader: ITableReader<RawPayrollReportItemData>,
    private payrollTableRenderer: ITableRenderer<{ comment?: string }>,
    private rawPayrollDataVerifier: IRawPayrollDataVerifier
  ) {}

  async checkUnitPayroll(monthAndYear: string): Promise<UseCaseResult> {
    return handleError(async () => {
      MonthStringSchema.parse(monthAndYear);
      const [rawData, payrollItemsFromReports] = await Promise.all([
        this.payrollTableReader.read(),
        this.reportItemsToPayrolls(),
      ]);
      const issuesFromTracker = await this.rawPayrollDataVerifier.verify(rawData, monthAndYear);

      const validator = new PayrollDataValidator();
      validator.validate(rawData);

      const payrollResolver = new PayrollPeriodResolver();
      const { payrolls } = payrollResolver.resolve(rawData, monthAndYear);
      const issues = this.comparePayrolls(payrolls, payrollItemsFromReports, issuesFromTracker);

      await this.renderIssues(issues, rawData);

      return UseCaseResult.Ok();
    });
  }

  private async reportItemsToPayrolls(): Promise<Map<PayrollValue, PayrollItem[]>> {
    const payrolls = new Map();
    const [report30RawData, report50RawData, report70RawData, report100RawData] = await Promise.all(
      [
        this.report30TableReader.read(),
        this.report50TableReader.read(),
        this.report70TableReader.read(),
        this.report100TableReader.read(),
      ]
    );

    payrolls.set(
      30,
      PayrollParserService.parseDateRanges(this.fillMissingInfo(report30RawData), 30)
    );
    payrolls.set(
      50,
      PayrollParserService.parseDateRanges(this.fillMissingInfo(report50RawData), 50)
    );
    payrolls.set(
      70,
      PayrollParserService.parseDateRanges(this.fillMissingInfo(report70RawData), 70)
    );
    payrolls.set(100, PayrollParserService.parseDateRanges(this.fillMissingInfo(report100RawData)));

    return payrolls;
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

  private comparePayrolls(
    payrolls: Map<PayrollValue, PayrollItem[]>,
    payrollItemsFromReports: Map<PayrollValue, PayrollItem[]>,
    issues: Map<string, string> = new Map()
  ): Map<string, string> {
    for (const [value, items] of payrolls) {
      const itemsFromReport = payrollItemsFromReports.get(value) || [];
      const { differences } = PayrollAnalysisService.ComparePayrolls(items, itemsFromReport);

      for (const difference of differences) {
        const differenceMessage = this.differenceToMessage(difference, value);
        const updatedErrors = issues.has(difference.taxPayerId)
          ? `${issues.get(difference.taxPayerId)}; ${differenceMessage}`
          : differenceMessage;
        issues.set(difference.taxPayerId, updatedErrors);
      }
    }

    return issues;
  }

  private differenceToMessage(difference: ComparisonDifference, value: number): string {
    switch (difference.type) {
      case "missing_serviceman":
        return `У рапорті ${value} відсутній військовослужбовець: ${difference.servicemanFullName}`;
      case "extra_serviceman":
        return `У рапорті ${value} зайвий військовослужбовець: ${difference.servicemanFullName}`;
      case "different_ranges":
        const { missingInFirst, missingInSecond } = difference.details;
        const firstPart = missingInFirst.length
          ? `Відсутні дати ${value} у відомості: ${missingInFirst.join(", ")}`
          : "";
        const secondPart = missingInSecond.length
          ? `Відсутні дати у рапорті ${value}: ${missingInSecond.join(", ")}`
          : "";
        return [firstPart, secondPart].filter(Boolean).join(" ");
    }
  }

  private async renderIssues(issues: Map<string, string>, rawData: RawPayrollData[]) {
    const dataToRender = rawData.map((item) => {
      const key = item.taxPayerId ? String(item.taxPayerId) : item?.fullName;

      return {
        comment: issues.get(key) || "",
      };
    });

    if (dataToRender.length === 0) {
      return;
    }

    return this.payrollTableRenderer.render(dataToRender);
  }
}
