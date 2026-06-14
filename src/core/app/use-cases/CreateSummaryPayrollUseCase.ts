import {
  RawPayrollData,
  PayrollPeriodResolver,
  OverlapResult,
  PayrollAnalysisService,
  PayrollRenderItem,
  PayrollValue,
  PayrollItem,
} from "../../domain";
import { ITableRenderer, ITableReader } from "../ports";
import { UseCaseResult } from "./UseCaseResult";
import { MonthStringSchema } from "./validation/RawInstructorsDataValidation";
import { handleError } from "./ErrorHandler";
import { PayrollDataValidator } from "./validation/RawPayrollData";

type OverlapOutput = {
  fullName: string;
  dates: string;
  militaryRank?: string;
  taxPayerId?: string;
};

export type Reason = {
  id: string;
  description: string;
};

export class CreateSummaryPayrollUseCase {
  private reasonsMap: Map<string, string> = new Map();

  constructor(
    private tableReader: ITableReader<RawPayrollData>,
    private reasonsMapReader: ITableReader<Reason>,
    private overlapsTableRenderer: ITableRenderer<OverlapOutput>,
    private table30Renderer: ITableRenderer<PayrollRenderItem>,
    private table50Renderer: ITableRenderer<PayrollRenderItem>,
    private table70Renderer: ITableRenderer<PayrollRenderItem>,
    private table100Renderer: ITableRenderer<PayrollRenderItem>
  ) {}

  async generateSummary(monthAndYear: string): Promise<UseCaseResult> {
    return handleError(async () => {
      MonthStringSchema.parse(monthAndYear);
      const [rawData] = await Promise.all([this.tableReader.read(), this.readReasons()]);

      const validator = new PayrollDataValidator();
      validator.validate(rawData);

      const payrollResolver = new PayrollPeriodResolver();

      const { payrolls, payrollsByServiceman } = payrollResolver.resolve(rawData, monthAndYear);
      const overlaps = PayrollAnalysisService.DetectOverlaps(payrollsByServiceman);

      if (overlaps.length > 0) {
        await this.renderOverlaps(overlaps);
        return UseCaseResult.ValidationError(`Задвоєних періодів: ${overlaps.length}`);
      }

      await this.renderSummary(payrolls);

      return UseCaseResult.Ok();
    });
  }

  async check(monthAndYear: string) {
    MonthStringSchema.parse(monthAndYear);
    const rawData = await this.tableReader.read();

    const validator = new PayrollDataValidator();
    validator.validate(rawData);

    const payrollResolver = new PayrollPeriodResolver();
    const { payrolls, payrollsByServiceman } = payrollResolver.resolve(rawData, monthAndYear);
  }

  private async renderOverlaps(overlaps: OverlapResult[]) {
    await this.overlapsTableRenderer.render(
      overlaps.map(({ serviceman, overlaps }) => ({
        fullName: serviceman.fullName.toString(),
        militaryRank: serviceman?.militaryRank,
        taxPayerId: String(serviceman?.taxPayerId),
        dates: overlaps?.join(", "),
      }))
    );
  }

  private async readReasons() {
    const reasons = await this.reasonsMapReader.read();
    reasons.forEach(({ id, description }) => this.reasonsMap.set(id, description));
  }

  private async renderSummary(payrolls: Map<PayrollValue, PayrollItem[]>) {
    await Promise.all([
      this.table30Renderer.render(this.getPayrollsRenderItems(payrolls, 30)),
      this.table50Renderer.render(this.getPayrollsRenderItems(payrolls, 50)),
      this.table70Renderer.render(this.getPayrollsRenderItems(payrolls, 70)),
      this.table100Renderer.render(this.getPayrollsRenderItems(payrolls, 100)),
    ]);
  }

  private getPayrollsRenderItems(
    payrolls: Map<PayrollValue, PayrollItem[]>,
    value: PayrollValue
  ): PayrollRenderItem[] {
    return (
      payrolls
        .get(value)
        ?.map((item) => ({ ...item.getRenderItem(), reason: this.reasonsMap.get(item.reason) })) ||
      []
    );
  }
}
