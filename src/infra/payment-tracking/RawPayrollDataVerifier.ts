import { IRawPayrollDataVerifier, RawPayrollData } from "../../core";
import { BASE_URL } from "./constants";

interface VerificationResult {
  fullName: string;
  taxPayerId: string;
  errors: { type: string; description: string }[];
}

export class RawPayrollDataVerifier implements IRawPayrollDataVerifier {
  constructor() {}

  async verify(data: RawPayrollData[], monthAndYear: string): Promise<Map<string, string>> {
    try {
      const payload = this.preparePayload(data, monthAndYear);
      const verificationResult = await this.fetchVerificationData(payload);
      return this.verificationResultsToIssues(data, verificationResult);
    } catch (error) {
      console.log("RawPayrollDataVerifier.verify", error);

      return new Map();
    }
  }

  private verificationResultsToIssues(
    rawData: RawPayrollData[],
    verificationResult: VerificationResult[]
  ): Map<string, string> {
    const issues = new Map<string, string>();
    verificationResult
      .filter((r) => r.errors.length > 0)
      .forEach((item) => {
        const rawItem = rawData.find(
          (r) => r.taxPayerId === item.taxPayerId || r.fullName === item.fullName
        );

        if (!rawItem) {
          return;
        }

        const errors = item.errors.map((e) => e.description).join("; ");
        const key = rawItem.taxPayerId ? String(rawItem.taxPayerId) : rawItem.fullName;
        issues.set(key, errors);
      });

    return issues;
  }

  private fetchVerificationData(body: string) {
    return fetch(`${BASE_URL}/payroll-tables/verifyItems`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body,
    }).then((r) => r.json());
  }

  private preparePayload(data: RawPayrollData[], monthAndYear: string): string {
    const [rawMonth, rawYear] = monthAndYear.split(".");
    const items = this.toItems(data, monthAndYear);
    return JSON.stringify({
      items,
      savePayments: false,
      year: Number(rawYear),
      month: Number(rawMonth),
    });
  }

  private toItems(data: RawPayrollData[], monthAndYear: string) {
    return data.map((item) => {
      const payments30Dates = [];
      const payments50Dates = [];
      const payments70Dates = [];
      const payments100Dates = [];
      for (let index = 1; index < 31; index++) {
        const key = index < 10 ? `0${index}.${monthAndYear}` : `${index}.${monthAndYear}`;
        const value = item[key];

        if (value === 30) {
          payments30Dates.push(index);
        } else if (value === 50) {
          payments50Dates.push(index);
        } else if (value === 70) {
          payments70Dates.push(index);
        } else if (value === 100) {
          payments100Dates.push(index);
        }
      }

      return {
        fullName: item.fullName,
        taxPayerId: item.taxPayerId ? String(item.taxPayerId) : undefined,
        militaryRank: item.militaryRank,
        payments30Dates,
        payments50Dates,
        payments70Dates,
        payments100Dates,
      };
    });
  }
}
