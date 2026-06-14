import { z } from "zod";
import { PayrollValueValidationError } from "../errors/PayrollValueValidationError";

// ✅ Part 1: Validate only known/required fields
export const RawPayrollDataBaseSchema = z
  .object({
    fullName: z.string().min(1, "Full name is required"),
    militaryRank: z.string().min(1, "Military rank is required"),
    unit: z.union([z.string().min(1, "Unit is required"), z.number()]).optional(),
    taxPayerId: z.union([z.string(), z.number()]).optional(),
    reason: z.any().optional(),
  })
  .passthrough(); // Allow additional fields but don't validate them yet

// For array validation
export const RawPayrollDataBaseArraySchema = z.array(RawPayrollDataBaseSchema);

const DATE_KEY_REGEX = /^\d{2}\.\d{2}\.\d{4}$/;
const ALLOWED_PAYROLL_VALUES = [30, 50, 70, 100, 170] as const;

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export class PayrollDataValidator {
  private readonly knownFields = ["fullName", "militaryRank", "unit", "taxPayerId", "reason"];

  validateDynamicFields(data: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [key, value] of Object.entries(data)) {
      // Skip known fields
      if (this.knownFields.includes(key)) {
        continue;
      }

      // ✅ Part 2a: Validate date key format
      if (!this.isValidDateKey(key)) {
        errors.push({
          field: key,
          message: `Invalid date format. Expected DD.MM.YYYY, got: ${key}`,
          value: key,
        });
        continue;
      }

      // ✅ Part 2b: Validate payroll value
      const valueValidation = this.validatePayrollValue(key, value);
      if (!valueValidation.isValid) {
        errors.push(...valueValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  validate(dataArray: Record<string, any>[]): ValidationResult {
    const allErrors: ValidationError[] = [];
    RawPayrollDataBaseArraySchema.parse(dataArray);

    dataArray.forEach((data, index) => {
      const result = this.validateDynamicFields(data);

      if (!result.isValid) {
        result.errors.forEach((error) => {
          allErrors.push({
            ...error,
            field: `[${data.fullName}] ${error.field}`,
          });
        });
      }
    });

    if (allErrors.length > 0) {
      throw new PayrollValueValidationError(allErrors.map((e) => e.message).join(";"));
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
    };
  }

  /**
   * Check if key matches date format DD.MM.YYYY
   */
  private isValidDateKey(key: string): boolean {
    if (!DATE_KEY_REGEX.test(key)) {
      return false;
    }

    // Additional validation: check if it's a valid date
    const [day, month, year] = key.split(".").map(Number);

    if (year < 2000 || year > 2100) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    // Check if date is actually valid (e.g., no Feb 30)
    const date = new Date(year, month - 1, day);
    return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
  }

  /**
   * Validate payroll value for a date field
   */
  private validatePayrollValue(key: string, value: any): ValidationResult {
    const errors: ValidationError[] = [];

    // Allow empty string (no payroll for this day)
    if (
      (typeof value === "string" && value.trim() === "") ||
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return { isValid: true, errors: [] };
    }

    // Check if it's an allowed payroll value
    if (!ALLOWED_PAYROLL_VALUES.includes(Number(value) as any)) {
      errors.push({
        field: key,
        message: `Invalid payroll value. Allowed values: ${ALLOWED_PAYROLL_VALUES.join(", ")}. Got: ${value}`,
        value,
      });
      return { isValid: false, errors };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Extract only date fields from data
   */
  extractDateFields(data: Record<string, any>): Record<string, number | string> {
    const dateFields: Record<string, number | string> = {};

    for (const [key, value] of Object.entries(data)) {
      if (!this.knownFields.includes(key) && DATE_KEY_REGEX.test(key)) {
        dateFields[key] = value;
      }
    }

    return dateFields;
  }
}
