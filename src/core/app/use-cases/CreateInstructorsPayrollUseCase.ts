import { ZodError } from "zod";
import {
  PayrollRenderItem,
  DateRange,
  Serviceman,
  PayrollItem,
  RawPayrollReportItemData,
} from "../../domain";
import { ITableRenderer, ITableReader } from "../ports";
import { UseCaseResult } from "./UseCaseResult";
import {
  MonthStringSchema,
  RawInstructorsDataValidator,
} from "./validation/RawInstructorsDataValidation";
import { handleError } from "./ErrorHandler";

export class CreateInstructorsPayrollUseCase {
  constructor(
    private tableReader: ITableReader<RawPayrollReportItemData>,
    private tableRenderer: ITableRenderer<PayrollRenderItem>
  ) {}

  async execute(month: string): Promise<UseCaseResult> {
    return handleError(async () => {
      MonthStringSchema.parse(month);
      const rawData = await this.tableReader.read();

      const validData = RawInstructorsDataValidator.parse(rawData);
      const payrollItems = this.parseDateRanges(validData, month);
      const renderItems = payrollItems.map((item) => item.getRenderItem());

      await this.tableRenderer.render(renderItems);

      return UseCaseResult.Ok();
    });
  }

  private parseDateRanges(data: RawPayrollReportItemData[], month: string): PayrollItem[] {
    return data.map((item) =>
      PayrollItem.Create(
        Serviceman.fromRaw(item),
        DateRange.FromInstructorsString(item.dates, month),
        30
      )
    );
  }
}
