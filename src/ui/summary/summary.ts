import { UseCaseResult } from "../../core/app/use-cases";
import { Container } from "../../di/container";
import { z as zod } from "zod";

const MonthStringSchema = zod
  .string()
  .regex(/^(0[1-9]|1[0-2])\.\d{4}$/, "Неправильний місяць (MM.YYYY)");

const showStatus = (status: UseCaseResult) => {
  const statusEl = document.getElementById("status")!;
  statusEl.textContent = status.message;
  statusEl.style.display = "block";
  statusEl.style.color = status.isError() ? "red" : "green";
};

const handleCreatePayroll = async (e) => {
  e.preventDefault();

  const month = (document.getElementById("month") as HTMLInputElement).value;
  const validationResult = MonthStringSchema.safeParse(month);
  if (!validationResult.success) {
    showStatus(UseCaseResult.ValidationError(validationResult.error.message));
    return;
  }

  const createMedicalPayrollUseCase = new Container().createMedicalPayrollUseCase(month);

  const result = await createMedicalPayrollUseCase.execute();
  showStatus(result);
};

Office.onReady((info) => {
  if (info.host === Office.HostType.Excel) {
    const form = document.getElementById("medicalForm")!;
    const main = document.getElementById("app-body")!;

    main.style.display = "block";

    form.addEventListener("submit", handleCreatePayroll);
  }
});
