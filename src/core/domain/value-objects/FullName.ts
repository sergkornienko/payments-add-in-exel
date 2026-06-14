export class FullName {
  private readonly value: string;

  constructor(name: string) {
    this.value = this.normalize(name);
  }

  private normalize(name: string): string {
    if (!name) return "";

    return name
      .trim()
      .split(/\s+/)
      .map((w, i) =>
        i === 0
          ? w.trim().toUpperCase()
          : w[0].trim().toUpperCase() + w.trim().toLowerCase().slice(1)
      )
      .join(" ");
  }

  toString(): string {
    return this.value;
  }

  equals(other: FullName): boolean {
    return this.value === other.value;
  }
}
