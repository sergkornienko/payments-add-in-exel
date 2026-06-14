import { UseCaseResult } from "../../core/app/use-cases";
import { Container } from "../../di/container";
import { z as zod } from "zod";

const MonthStringSchema = zod
  .string()
  .regex(/^(0[1-9]|1[0-2])\.\d{4}$/, "Неправильний місяць (MM.YYYY)");

const showStatus = (status?: UseCaseResult) => {
  const statusEl = document.getElementById("status")!;
  let color = "orange";
  let message = "Опрацьовується";

  if (status) {
    color = status.isError() ? "red" : "green";
    message = status.message;
  }

  statusEl.textContent = message;
  statusEl.style.display = "block";
  statusEl.style.color = color;
};

const handleCreatePayroll = async (e) => {
  e.preventDefault();
  showStatus();

  const month = (document.getElementById("month") as HTMLInputElement).value;
  const validationResult = MonthStringSchema.safeParse(month);
  if (!validationResult.success) {
    showStatus(UseCaseResult.ValidationError(validationResult.error.message));
    return;
  }

  const createInstructorsPayrollUseCase = new Container().createInstructorsPayrollUseCase(month);

  const result = await createInstructorsPayrollUseCase.execute(month);
  showStatus(result);
};

Office.onReady((info) => {
  if (info.host === Office.HostType.Excel) {
    const form = document.getElementById("instructorsForm")!;
    const main = document.getElementById("app-body")!;

    main.style.display = "block";

    form.addEventListener("submit", handleCreatePayroll);
  }
});
