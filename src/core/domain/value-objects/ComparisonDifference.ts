export interface ComparisonResult {
  areEqual: boolean;
  differences: ComparisonDifference[];
}

export class ComparisonDifference {
  static MissingServiceman(taxPayerId: string, fullName: string): ComparisonDifference {
    return new ComparisonDifference("missing_serviceman", taxPayerId, fullName);
  }

  static ExtraServiceman(taxPayerId: string, fullName: string): ComparisonDifference {
    return new ComparisonDifference("extra_serviceman", taxPayerId, fullName);
  }

  static DifferentRanges(
    taxPayerId: string,
    fullName: string,
    missingInFirst: string[],
    missingInSecond: string[]
  ): ComparisonDifference {
    return new ComparisonDifference("different_ranges", taxPayerId, fullName, {
      missingInFirst,
      missingInSecond,
    });
  }

  private constructor(
    public readonly type: "missing_serviceman" | "extra_serviceman" | "different_ranges",
    public readonly taxPayerId: string,
    public readonly servicemanFullName: string,
    public readonly details?: any
  ) {}
}
