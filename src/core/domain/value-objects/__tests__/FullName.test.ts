import { FullName } from "../FullName";

describe("FullName", () => {
  describe("normalize", () => {
    it("should capitalize last name and first/middle names", () => {
      const name = new FullName("пєтовоа пЕТро петрович");
      expect(name.toString()).toBe("ПЄТОВОА Петро Петрович");
    });

    it("should trim extra spaces", () => {
      const name = new FullName("  Пєтовоа   Петро  Петрович  ");
      expect(name.toString()).toBe("ПЄТОВОА Петро Петрович");
    });

    it("should return empty string for empty input", () => {
      const name = new FullName("");
      expect(name.toString()).toBe("");
    });
  });

  describe("toString", () => {
    it("should return the normalized full name", () => {
      const name = new FullName("пєтовоа пЕТро петрович");
      expect(name.toString()).toBe("ПЄТОВОА Петро Петрович");
    });
  });

  describe("equals", () => {
    it("should return true when two FullName instances have the same normalized value", () => {
      const name1 = new FullName("пєтовоа пЕТро петрович");
      const name2 = new FullName("ПЄТОВОА Петро Петрович");
      expect(name1.equals(name2)).toBe(true);
    });

    it("should return false when two FullName instances have different normalized values", () => {
      const name1 = new FullName("Петрова Петро Петрович");
      const name2 = new FullName("Иванов Иван Иванович");
      expect(name1.equals(name2)).toBe(false);
    });
  });
});
