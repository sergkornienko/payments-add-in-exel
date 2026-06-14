import { RawPayrollData } from "../../domain";

export interface IRawPayrollDataVerifier {
  verify(data: RawPayrollData[], monthAndYear: string): Promise<Map<string, string>>;
}
