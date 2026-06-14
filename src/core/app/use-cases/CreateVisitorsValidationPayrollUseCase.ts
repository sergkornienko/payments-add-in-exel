import {
  RawPayrollData,
  PayrollPeriodResolver,
  PayrollAnalysisService,
  PayrollValue,
  PayrollItem,
  ComparisonDifference,
  PayrollParserService,
  FullName,
} from "../../domain";
import { ITableRenderer, ITableReader } from "../ports";
import { UseCaseResult } from "./UseCaseResult";
import { MonthStringSchema } from "./validation/RawInstructorsDataValidation";
import { handleError } from "./ErrorHandler";
import { PayrollDataValidator } from "./validation/RawPayrollData";

const normalizeDay = (day: number) => (day < 10 ? `0${day}` : day);

export class CreateVisitorsValidationPayrollUseCase {
  constructor(
    private payrollTableReader: ITableReader<RawPayrollData>,
    private visitorsTableReader: ITableReader<RawPayrollData>,
    private payrollTableRenderer: ITableRenderer<{ comment?: string }>
  ) {}

  async validateVisitors(monthAndYear: string): Promise<UseCaseResult> {
    return handleError(async () => {
      MonthStringSchema.parse(monthAndYear);
      const [rawData, rawVisitorsData] = await Promise.all([
        this.fetchRawPayroll(),
        this.fetchRawVisitors(monthAndYear),
      ]);

      const payrollResolver = new PayrollPeriodResolver();
      const { payrolls, payrollsByServiceman } = payrollResolver.resolve(rawData, monthAndYear);
      const { payrolls: visitorsPayroll, payrollsByServiceman: visitors } = payrollResolver.resolve(
        rawVisitorsData,
        monthAndYear
      );
      const issues = this.comparePayrolls(payrolls, visitorsPayroll, payrollsByServiceman);

      await this.renderIssues(issues, rawData, visitors);

      return UseCaseResult.Ok();
    });
  }

  private async fetchRawPayroll() {
    const rawData = await this.payrollTableReader.read();

    const validator = new PayrollDataValidator();
    validator.validate(rawData);

    // don't touch removing taxPayerId, It needed to compare payrolls
    return rawData.map((item) => ({ ...item, taxPayerId: undefined }));
  }

  private async fetchRawVisitors(monthAndYear: string) {
    const rawData = await this.visitorsTableReader.read();
    return rawData.map((item) => {
      const [month, year] = monthAndYear.split(".");
      const daysInMonth = new Date(Number(year), Number(month), 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const key = `${normalizeDay(day)}.${monthAndYear}`;
        if (item[key]) {
          item[key] = 100;
        }
      }

      return item;
    });
  }

  private comparePayrolls(
    payrolls: Map<PayrollValue, PayrollItem[]>,
    payrollItemsFromReports: Map<PayrollValue, PayrollItem[]>,
    servicemans: Map<string, PayrollItem[]>,
    issues: Map<string, string> = new Map()
  ): Map<string, string> {
    const value = 100;
    const items = payrolls.get(value);

    const itemsFromReport = payrollItemsFromReports.get(value) || [];
    const { differences } = PayrollAnalysisService.ComparePayrolls(items, itemsFromReport);

    for (const difference of differences) {
      if (!servicemans.has(difference.servicemanFullName)) {
        continue;
      }

      const differenceMessage = this.differenceToMessage(difference);
      const updatedErrors = issues.has(difference.servicemanFullName)
        ? `${issues.get(difference.servicemanFullName)}; ${differenceMessage}`
        : differenceMessage;
      issues.set(difference.servicemanFullName, updatedErrors);
    }

    return issues;
  }

  private differenceToMessage(difference: ComparisonDifference): string {
    switch (difference.type) {
      case "missing_serviceman":
        return `Ніхто не вказав у відомості відвідування: ${difference.servicemanFullName}`;
      case "extra_serviceman":
        return `Не проставили 100: ${difference.servicemanFullName}`;
      case "different_ranges":
        const { missingInFirst, missingInSecond } = difference.details;
        const firstPart = missingInFirst.length
          ? `Не проставили 100 у відомості: ${missingInFirst.join(", ")}`
          : "";
        const secondPart = missingInSecond.length
          ? `Відсутні дати у відомостях відвідування: ${missingInSecond.join(", ")}`
          : "";
        return [firstPart, secondPart].filter(Boolean).join(" ");
    }
  }

  private async renderIssues(
    issues: Map<string, string>,
    rawData: RawPayrollData[],
    visitors: Map<string, PayrollItem[]>
  ) {
    let overrides = [];

    const dataToRender = rawData.map((item) => {
      const key = new FullName(item.fullName).toString();
      const payrolls = visitors.get(key) || [];
      const ranges = payrolls
        .map((payrollItem) => payrollItem.getRenderItem().dateRange)
        .join("; ");
      const comment = `${ranges} ${issues.get(key) || ""}`.trim();

      const rowOverrides = payrolls
        .flatMap((payrollItem) => payrollItem.getDates())
        .map((field) => ({ rowId: key, field, styleId: "visitors" }));
      overrides = [...overrides, ...rowOverrides];

      return { id: key, comment };
    });

    if (dataToRender.length === 0) {
      return;
    }

    return this.payrollTableRenderer.render(dataToRender, overrides);
  }
}
