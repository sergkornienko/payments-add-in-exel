import {
  ExcelRenderer,
  StyleRenderer,
  ExcelReader,
  RawPayrollDataVerifier,
  DocxDocumentsPopulator,
} from "../infra";
import {
  CreateMedicalPayrollUseCase,
  CreateInstructorsPayrollUseCase,
  RawPayrollReportItemData,
  RawPayrollData,
  CreateSummaryPayrollUseCase,
  Reason,
  Raw70InitialData,
  Raw70PayrollData,
  CreateCheckUnitPayrollUseCase,
  CreateVisitorsValidationPayrollUseCase,
  PayrollRenderItem,
  CreateAuditUseCase,
} from "../core";
import {
  getMedicalOutputSchema,
  getInstructorsOutputSchema,
  getSummaryPayrollSchema,
  SUMMARY_PAYROLL_OVERLAP_OUTPUT_SCHEMA,
  getSummaryOutputPayrollSchema,
  REASONS_MAP_INPUT_SCHEMA,
  getCommentsTableSchema,
  getInitial70OutputSchema,
  getAuditPayrollSchema,
} from "../config/tables/";
import { STYLES, COLUMN_STYLES } from "../config/tables/styles";
import {
  INITIAL_70_INPUT_SCHEMA,
  PAYROLLS_70_INPUT_SCHEMA,
  REWARD_ACCRUAL_70_OUTPUT_SCHEMA,
  PAYROLL_70_OUTPUT_SCHEMA,
  getPayrollReportTableSchema,
  getVisitorsPayrollSchema,
} from "../config/tables";
import { Create70PayrollUseCase } from "../core/";

export class Container {
  constructor() {}

  createMedicalPayrollUseCase(schemaParams: any) {
    const styleRenderer = new StyleRenderer(STYLES, COLUMN_STYLES);
    const exelReader = new ExcelReader<RawPayrollReportItemData>(getPayrollReportTableSchema());
    const medicalSchema = getMedicalOutputSchema(schemaParams);

    const exelRenderer = new ExcelRenderer(medicalSchema, styleRenderer);
    return new CreateMedicalPayrollUseCase(exelReader, exelRenderer);
  }

  createInstructorsPayrollUseCase(schemaParams: any) {
    const styleRenderer = new StyleRenderer(STYLES, COLUMN_STYLES);
    const exelReader = new ExcelReader<RawPayrollReportItemData>(getPayrollReportTableSchema());
    const instructorsSchema = getInstructorsOutputSchema(schemaParams);

    const exelRenderer = new ExcelRenderer(instructorsSchema, styleRenderer);
    return new CreateInstructorsPayrollUseCase(exelReader, exelRenderer);
  }

  createCheckPayrollUseCase(monthAndYear: string, startRow: any) {
    const styleRenderer = new StyleRenderer(STYLES, COLUMN_STYLES);
    const inputPayrollSchema = getSummaryPayrollSchema(monthAndYear, { startRow });
    const payrollReader = new ExcelReader<RawPayrollData>(inputPayrollSchema);

    const report10TableReader = new ExcelReader<RawPayrollReportItemData>(
      getPayrollReportTableSchema({ sheetName: "10" })
    );
    const report20TableReader = new ExcelReader<RawPayrollReportItemData>(
      getPayrollReportTableSchema({ sheetName: "20" })
    );
    const report30TableReader = new ExcelReader<RawPayrollReportItemData>(
      getPayrollReportTableSchema({ sheetName: "30" })
    );
    const report40TableReader = new ExcelReader<RawPayrollReportItemData>(
      getPayrollReportTableSchema({ sheetName: "40" })
    );
    const report50TableReader = new ExcelReader<RawPayrollReportItemData>(
      getPayrollReportTableSchema({ sheetName: "50" })
    );
    const report70TableReader = new ExcelReader<RawPayrollReportItemData>(
      getPayrollReportTableSchema({ sheetName: "70" })
    );
    const report100TableReader = new ExcelReader<RawPayrollReportItemData>(
      getPayrollReportTableSchema({ sheetName: "100" })
    );
    const report170TableReader = new ExcelReader<RawPayrollReportItemData>(
      getPayrollReportTableSchema({ sheetName: "170" })
    );
    const exelRenderer = new ExcelRenderer(
      getCommentsTableSchema(monthAndYear, { startRow }),
      styleRenderer
    );
    const rawPayrollDataVerifier = new RawPayrollDataVerifier();

    return new CreateCheckUnitPayrollUseCase(
      payrollReader,
      report10TableReader,
      report20TableReader,
      report30TableReader,
      report40TableReader,
      report50TableReader,
      report70TableReader,
      report100TableReader,
      report170TableReader,
      exelRenderer,
      rawPayrollDataVerifier
    );
  }

  createVisitorsValidationUseCase(monthAndYear: string, startRow: any) {
    const styleRenderer = new StyleRenderer(STYLES, COLUMN_STYLES);
    const inputPayrollSchema = getSummaryPayrollSchema(monthAndYear, { startRow });
    const payrollReader = new ExcelReader<RawPayrollData>(inputPayrollSchema);
    const visitorsReader = new ExcelReader<RawPayrollData>(getVisitorsPayrollSchema(monthAndYear));

    const exelRenderer = new ExcelRenderer(
      getCommentsTableSchema(monthAndYear, { startRow }),
      styleRenderer
    );

    return new CreateVisitorsValidationPayrollUseCase(payrollReader, visitorsReader, exelRenderer);
  }

  create70PayrollUseCase() {
    const styleRenderer = new StyleRenderer(STYLES, COLUMN_STYLES);
    const initialTableReader = new ExcelReader<Raw70InitialData>(INITIAL_70_INPUT_SCHEMA);
    const payrollsTableReader = new ExcelReader<Raw70PayrollData>(PAYROLLS_70_INPUT_SCHEMA);
    const orderTableReader = new ExcelReader<PayrollRenderItem>(PAYROLL_70_OUTPUT_SCHEMA);

    const rewardAccrualTableRenderer = new ExcelRenderer(
      REWARD_ACCRUAL_70_OUTPUT_SCHEMA,
      styleRenderer
    );
    const payrollTableRenderer = new ExcelRenderer(PAYROLL_70_OUTPUT_SCHEMA, styleRenderer);
    const initialTableRenderer = new ExcelRenderer(
      getInitial70OutputSchema({ sheetName: "70" }),
      styleRenderer
    );
    const newServicemansTableRenderer = new ExcelRenderer(
      getInitial70OutputSchema({ sheetName: "70 нові" }),
      styleRenderer
    );

    return new Create70PayrollUseCase(
      initialTableReader,
      payrollsTableReader,
      orderTableReader,
      rewardAccrualTableRenderer,
      payrollTableRenderer,
      newServicemansTableRenderer,
      initialTableRenderer
    );
  }

  createSummaryPayrollUseCase(schemaParams: any) {
    const styleRenderer = new StyleRenderer(STYLES, COLUMN_STYLES);
    const inputPayrollSchema = getSummaryPayrollSchema(schemaParams);
    const exelReader = new ExcelReader<RawPayrollData>(inputPayrollSchema);
    const reasonExelReader = new ExcelReader<Reason>(REASONS_MAP_INPUT_SCHEMA);
    const overlapsExelRenderer = new ExcelRenderer(
      SUMMARY_PAYROLL_OVERLAP_OUTPUT_SCHEMA,
      styleRenderer
    );
    const exel10Renderer = new ExcelRenderer(getSummaryOutputPayrollSchema("10"), styleRenderer);
    const exel20Renderer = new ExcelRenderer(getSummaryOutputPayrollSchema("20"), styleRenderer);
    const exel30Renderer = new ExcelRenderer(getSummaryOutputPayrollSchema("30"), styleRenderer);
    const exel40Renderer = new ExcelRenderer(getSummaryOutputPayrollSchema("40"), styleRenderer);
    const exel50Renderer = new ExcelRenderer(getSummaryOutputPayrollSchema("50"), styleRenderer);
    const exel70Renderer = new ExcelRenderer(getSummaryOutputPayrollSchema("70"), styleRenderer);
    const exel100Renderer = new ExcelRenderer(getSummaryOutputPayrollSchema("100"), styleRenderer);
    const exel170Renderer = new ExcelRenderer(getSummaryOutputPayrollSchema("170"), styleRenderer);

    return new CreateSummaryPayrollUseCase(
      exelReader,
      reasonExelReader,
      overlapsExelRenderer,
      exel10Renderer,
      exel20Renderer,
      exel30Renderer,
      exel40Renderer,
      exel50Renderer,
      exel70Renderer,
      exel100Renderer,
      exel170Renderer
    );
  }

  createAuditUseCase() {
    const exelReader = new ExcelReader<RawPayrollData>(getAuditPayrollSchema("27.03.2023"));
    const docxPopulator = new DocxDocumentsPopulator();
    return new CreateAuditUseCase(exelReader, docxPopulator);
  }
}
