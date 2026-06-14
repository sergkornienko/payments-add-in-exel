import {
  PayrollRenderItem,
  DateRange,
  Serviceman,
  PayrollItem,
  Raw70InitialData,
  Raw70PayrollData,
  RewardAccrual,
  RewardAccrualRenderService,
  RewardAccrualRenderItem,
} from "../../domain";
import { ITableRenderer, ITableReader } from "../ports";
import { UseCaseResult } from "./UseCaseResult";
import { MonthStringSchema } from "./validation/RawInstructorsDataValidation";
import { handleError } from "./ErrorHandler";
import { Raw70InitialDataArraySchema, Raw70PayrollDataArraySchema } from "./validation/Raw70Data";

export class Create70PayrollUseCase {
  constructor(
    private initialTableReader: ITableReader<Raw70InitialData>,
    private payrollsTableReader: ITableReader<Raw70PayrollData>,
    private orderTableReader: ITableReader<PayrollRenderItem>,
    private rewardAccrualTableRenderer: ITableRenderer<RewardAccrualRenderItem>,
    private payrollTableRenderer: ITableRenderer<PayrollRenderItem>,
    private newServicemansTableRenderer: ITableRenderer<Raw70InitialData>,
    private initialTableRenderer: ITableRenderer<Raw70InitialData>
  ) {}

  async createOrderAnnex(monthAndYearStr: string): Promise<UseCaseResult> {
    return handleError(async () => {
      MonthStringSchema.parse(monthAndYearStr);
      const [rawInitialData, rawPayrollData] = await Promise.all([
        this.initialTableReader.read(),
        this.payrollsTableReader.read(),
      ]);

      this.validate(rawInitialData, rawPayrollData);
      const { servicemans, payrolls, accruals } = this.parseInputData(
        rawInitialData,
        rawPayrollData
      );

      const rewardAccrualRenderItems = RewardAccrualRenderService.generate(
        servicemans,
        payrolls,
        accruals
      );
      const payroll70RenderItems = RewardAccrualRenderService.generatePayrollRenderItems(
        servicemans,
        payrolls,
        accruals,
        monthAndYearStr
      );

      await Promise.all([
        this.payrollTableRenderer.render(payroll70RenderItems),
        this.rewardAccrualTableRenderer.render(rewardAccrualRenderItems),
      ]);

      return UseCaseResult.Ok();
    });
  }

  async addNotExisting() {
    const [rawInitialData, rawPayrollData] = await Promise.all([
      this.initialTableReader.read(),
      this.payrollsTableReader.read(),
    ]);

    const servicemans = new Map<string, 1>();
    rawInitialData.forEach((s) => s.taxPayerId && servicemans.set(String(s.taxPayerId), 1));

    const missedServicemans = rawPayrollData
      .filter((item) => !servicemans.get(String(item.taxPayerId)))
      .map((item) => ({
        ...item,
        position: "",
        remainingDaysFromPreviousYear: 0,
      }));

    await this.newServicemansTableRenderer.render(missedServicemans);
    return UseCaseResult.Ok();
  }

  async addOrder(order: string) {
    const [rawInitialData, rawOrderData] = await Promise.all([
      this.initialTableReader.read(),
      this.orderTableReader.read(),
    ]);
    const updatedInitialData = this.fillInitialData(rawInitialData, rawOrderData, order);

    await this.initialTableRenderer.render(updatedInitialData);

    return UseCaseResult.Ok();
  }

  private validate(rawInitialData: Raw70InitialData[], rawPayrollData: Raw70PayrollData[]) {
    Raw70InitialDataArraySchema.parse(rawInitialData);
    Raw70PayrollDataArraySchema.parse(rawPayrollData);
  }

  private parseInputData(
    rawInitialData: Raw70InitialData[],
    rawPayrollData: Raw70PayrollData[]
  ): {
    servicemans: Map<string, Serviceman>;
    payrolls: Map<string, PayrollItem[]>;
    accruals: RewardAccrual[];
  } {
    const servicemans = new Map<string, Serviceman>();
    const servicemansTaxPayersMap = new Map<string, string>();
    const payrolls = new Map<string, PayrollItem[]>();

    rawInitialData.forEach((item) => {
      const serviceman = Serviceman.FromRawExtended(item);
      servicemans.set(serviceman.id, serviceman);
      servicemansTaxPayersMap.set(serviceman.taxPayerId, serviceman.id);
    });

    rawPayrollData.forEach((item) => {
      const servicemanId = servicemansTaxPayersMap.get(String(item.taxPayerId));

      if (!servicemanId) {
        console.error("Serviceman id not found, need to create serviceman");
        // validation error
      }

      const serviceman = servicemans.get(servicemanId);
      const servicemanPayroll = PayrollItem.Create(
        serviceman,
        DateRange.FromString(item.dates),
        70,
        item.reason
      );
      const oldPayrolls = payrolls.get(servicemanId) || [];
      payrolls.set(servicemanId, [...oldPayrolls, servicemanPayroll]);
    });

    const accruals = rawInitialData.map((item) => {
      const servicemanId = servicemansTaxPayersMap.get(String(item.taxPayerId));

      return RewardAccrual.Create(
        servicemanId,
        payrolls.get(servicemanId) || [],
        item.paymentsOrders,
        item.remainingDaysFromPreviousYear
      );
    });

    return { accruals, servicemans, payrolls };
  }

  private fillInitialData(
    rawInitialData: Raw70InitialData[],
    rawOrderData: PayrollRenderItem[],
    order: string
  ) {
    const fromOrder = new Map();

    rawOrderData.forEach(({ taxPayerId, days }) => {
      fromOrder.set(String(taxPayerId).trim(), days);
    });

    return rawInitialData.map((item) => {
      const repeats = fromOrder.get(String(item.taxPayerId).trim());
      const newOrderText = Array(repeats || 0)
        .fill(order)
        .join("; ")
        .trim();

      if (newOrderText) {
        item.paymentsOrders = item.paymentsOrders
          ? `${item.paymentsOrders}; ${newOrderText}`.trim()
          : newOrderText;
      }

      return item;
    });
  }
}
