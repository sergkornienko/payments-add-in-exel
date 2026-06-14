import { PayrollItem } from "../entities/PayrollItem";
import { Serviceman } from "../entities/Serviceman";
import { ComparisonResult, ComparisonDifference } from "../value-objects";

export interface OverlapResult {
  serviceman: Serviceman;
  overlaps: string[];
}

export class PayrollAnalysisService {
  static DetectOverlaps(payrollsByServiceman: Map<string, PayrollItem[]>): OverlapResult[] {
    const results: OverlapResult[] = [];

    for (const [key, payrollItems] of payrollsByServiceman) {
      if (payrollItems.length === 0) continue;

      const serviceman = payrollItems[0].serviceman;
      const dateOccurrences = this.collectDateOccurrences(payrollItems);
      const overlaps = this.findOverlappingDates(dateOccurrences);

      if (overlaps.length > 0) {
        results.push({
          serviceman,
          overlaps,
        });
      }
    }

    return results;
  }

  static ComparePayrolls(
    firstPayrolls: PayrollItem[],
    secondPayrolls: PayrollItem[]
  ): ComparisonResult {
    const firstPayrollsMap = this.payrollsToMap(firstPayrolls);
    const secondPayrollsMap = this.payrollsToMap(secondPayrolls);
    let differences: ComparisonDifference[] = [];

    for (const [servicemanFullName, payrollsFromFirst] of firstPayrollsMap) {
      const payrollsFromSecond = secondPayrollsMap.get(servicemanFullName);
      const taxPayerId = payrollsFromFirst?.[0]?.serviceman?.taxPayerId;

      if (!payrollsFromSecond) {
        differences.push(ComparisonDifference.MissingServiceman(taxPayerId, servicemanFullName));
        continue;
      }

      const firstServicemanDates = payrollsFromFirst.flatMap((item) => item.getDates());
      const secondServicemanDates = payrollsFromSecond.flatMap((item) => item.getDates());
      const firstServicemanDatesSet = new Set(firstServicemanDates);
      const secondServicemanDatesSet = new Set(secondServicemanDates);
      const missedDatesInFirst = secondServicemanDates.filter(
        (date) => !firstServicemanDatesSet.has(date)
      );
      const missedDatesInSecond = firstServicemanDates.filter(
        (date) => !secondServicemanDatesSet.has(date)
      );

      if (missedDatesInFirst.length || missedDatesInSecond.length) {
        differences.push(
          ComparisonDifference.DifferentRanges(
            taxPayerId,
            servicemanFullName,
            missedDatesInFirst,
            missedDatesInSecond
          )
        );
      }

      secondPayrollsMap.delete(servicemanFullName);
    }

    for (const [fullName, payrollsFromSecond] of secondPayrollsMap) {
      const taxPayerId = payrollsFromSecond?.[0]?.serviceman?.taxPayerId;

      differences.push(ComparisonDifference.ExtraServiceman(taxPayerId, fullName));
    }

    return { areEqual: differences.length === 0, differences };
  }

  private static payrollsToMap(payrolls: PayrollItem[]): Map<string, PayrollItem[]> {
    const payrollsMap = new Map();

    payrolls.forEach((item) => {
      const fullName = item.serviceman.fullName.toString();
      const previousPayrolls = payrollsMap.get(fullName) || [];
      payrollsMap.set(fullName, [...previousPayrolls, item]);
    });

    return payrollsMap;
  }

  private static collectDateOccurrences(payrollItems: PayrollItem[]): Map<string, number> {
    const dateOccurrences = new Map<string, number>();

    for (const payrollItem of payrollItems) {
      if (payrollItem.value === 70) {
        continue;
      }

      for (const date of payrollItem.getDates()) {
        const count = dateOccurrences.get(date) || 0;
        dateOccurrences.set(date, count + 1);
      }
    }

    return dateOccurrences;
  }

  private static findOverlappingDates(dateOccurrences: Map<string, number>): string[] {
    const overlaps: string[] = [];

    for (const [date, count] of dateOccurrences) {
      if (count > 1) {
        overlaps.push(date);
      }
    }

    return overlaps.sort((a, b) => a.localeCompare(b));
  }
}
