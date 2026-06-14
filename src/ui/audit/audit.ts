import { UseCaseResult } from "../../core/app/use-cases";
import { Container } from "../../di/container";
import { z as zod } from "zod";

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

const handleCalculatePeriod = async (e) => {
  e.preventDefault();
  showStatus();

  const auditUseCase = new Container().createAuditUseCase();

  const result = await auditUseCase.calculatePeriod();
  showStatus(result);
};

const handleParticipationCertificate = async (e) => {
  e.preventDefault();
  showStatus();

  const participationCertificateUseCase = new Container().createAuditUseCase();

  const row = (document.getElementById("row") as HTMLInputElement).value;
  const result = await participationCertificateUseCase.createParticipationCertificate(row);
  showStatus(result);
};

Office.onReady((info) => {
  if (info.host === Office.HostType.Excel) {
    const form = document.getElementById("auditForm")!;
    const participationCertificateForm = document.getElementById("participationCertificateForm")!;
    const main = document.getElementById("app-body")!;

    main.style.display = "block";

    form.addEventListener("submit", handleCalculatePeriod);
    participationCertificateForm.addEventListener("submit", handleParticipationCertificate);
  }
});
