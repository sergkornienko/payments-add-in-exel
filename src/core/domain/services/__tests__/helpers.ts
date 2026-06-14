import { PayrollItem, Serviceman } from "../../entities";
import { DateRange, FullName, PayrollValue } from "../../value-objects";

export function makePayrollItem(
  serviceman: Serviceman,
  dateRanges: DateRange[],
  value: PayrollValue = 100,
  reason: string = ""
): PayrollItem {
  return PayrollItem.Create(serviceman, dateRanges, value, reason);
}

export function makeServiceman(id = "123", name = "John Doe"): Serviceman {
  return {
    id,
    fullName: new FullName(name),
    taxPayerId: id,
    militaryRank: "soldier",
    unit: "1 BOP",
  } as Serviceman;
}
