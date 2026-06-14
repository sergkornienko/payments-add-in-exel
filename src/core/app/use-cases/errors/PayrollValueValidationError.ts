export class PayrollValueValidationError extends Error {
  constructor(public readonly message: string) {
    super(`Invalid payroll value: ${message}`);

    this.name = "PayrollValueValidationError";
  }
}
