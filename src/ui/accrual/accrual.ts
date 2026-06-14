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

  const monthAndYear = (document.getElementById("month") as HTMLInputElement).value;
  const validationResult = MonthStringSchema.safeParse(monthAndYear);
  if (!validationResult.success) {
    showStatus(UseCaseResult.ValidationError(validationResult.error.message));
    return;
  }

  const create70PayrollUseCase = new Container().create70PayrollUseCase();

  const result = await create70PayrollUseCase.createOrderAnnex(monthAndYear);
  showStatus(result);
};

const handleAddNotExistingServicemans = async (e) => {
  e.preventDefault();
  showStatus();

  const create70PayrollUseCase = new Container().create70PayrollUseCase();

  const result = await create70PayrollUseCase.addNotExisting();
  showStatus(result);
};

const handleAddOrder = async (e) => {
  e.preventDefault();
  showStatus();

  const order = (document.getElementById("order") as HTMLInputElement).value;
  const create70PayrollUseCase = new Container().create70PayrollUseCase();

  const result = await create70PayrollUseCase.addOrder(order);
  showStatus(result);
};

window.addEventListener("load", () => {
  if (typeof Office !== "undefined") {
    Office.onReady((info) => {
      if (info.host === Office.HostType.Excel) {
        const form = document.getElementById("accrualForm")!;
        const addNotExistingForm = document.getElementById("accrualAddNotExistingServicemansForm")!;
        const addOrderForm = document.getElementById("addOrderForm")!;
        const main = document.getElementById("app-body")!;

        main.style.display = "block";

        form.addEventListener("submit", handleCreatePayroll);
        addNotExistingForm.addEventListener("submit", handleAddNotExistingServicemans);
        addOrderForm.addEventListener("submit", handleAddOrder);
      }
    });
  } else {
    console.error("❌ Office.js not available");
  }
});
