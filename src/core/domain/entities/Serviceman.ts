import { RawPayrollReportItemData } from "../value-objects";
import { FullName } from "../value-objects/FullName";
import { v4 as uuidv4 } from "uuid";

export class Serviceman {
  static fromRaw(data: Omit<RawPayrollReportItemData, "dates">): Serviceman {
    return new Serviceman(uuidv4(), new FullName(data.fullName), data.militaryRank);
  }

  static FromRawExtended(data: {
    fullName: string;
    militaryRank?: string;
    taxPayerId?: number | string;
    unit?: string;
    position?: string;
  }): Serviceman {
    const taxPayerId = data.taxPayerId ? String(data.taxPayerId) : undefined;
    return new Serviceman(
      uuidv4(),
      new FullName(data.fullName),
      data.militaryRank,
      taxPayerId,
      data.unit,
      data.position
    );
  }

  constructor(
    public readonly id: string,
    public readonly fullName: FullName,
    public readonly militaryRank?: string,
    public readonly taxPayerId?: string,
    public readonly unit?: string,
    public readonly position?: string
  ) {}

  equals(other: Serviceman): boolean {
    return this.fullName.equals(other.fullName);
  }
}
