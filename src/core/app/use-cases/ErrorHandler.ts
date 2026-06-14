import { ZodError } from "zod";
import { UseCaseResult } from "./UseCaseResult";
import { PayrollValueValidationError } from "./errors/PayrollValueValidationError";

export const handleError = async (callback) => {
  try {
    const res = await callback();
    return res;
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(error.issues);
      const message = error.issues
        .map(({ message, path }) => `${message} в рядку ${(path?.[0] as any) + 2}`)
        .join("\n");
      return UseCaseResult.ValidationError(message);
    } else if (error instanceof PayrollValueValidationError) {
      console.log(error);
      return UseCaseResult.ValidationError(error.message);
    }

    console.log(error);
    return UseCaseResult.UnknownError();
  }
};
