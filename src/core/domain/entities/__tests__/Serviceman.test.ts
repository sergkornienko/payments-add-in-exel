import { Serviceman } from "../Serviceman";
import { FullName } from "../../value-objects";
import { v4 as uuidv4 } from "uuid";

// Mock uuid so tests are predictable
jest.mock("uuid", () => ({ v4: () => "uuid-mock" }));

describe("Serviceman", () => {
  describe("constructor", () => {
    it("should correctly assign id, fullName, and militaryRank", () => {
      const fullName = new FullName("Петров Петро Петрович");
      const serviceman = new Serviceman("123", fullName, "Sergeant");

      expect(serviceman.id).toBe("123");
      expect(serviceman.fullName).toBe(fullName);
      expect(serviceman.militaryRank).toBe("Sergeant");
    });

    it("should allow militaryRank to be undefined", () => {
      const fullName = new FullName("Іванов Іван Іванович");
      const serviceman = new Serviceman("123", fullName);

      expect(serviceman.militaryRank).toBeUndefined();
    });
  });

  describe("equals", () => {
    it("should return true if two Servicemen have the same fullName", () => {
      const fullName1 = new FullName("Петров Петро Петрович");
      const fullName2 = new FullName("Петров Петро Петрович");

      const s1 = new Serviceman("1", fullName1, "Sergeant");
      const s2 = new Serviceman("2", fullName2, "Lieutenant");

      expect(s1.equals(s2)).toBe(true);
    });

    it("should return false if two Servicemen have different fullName", () => {
      const s1 = new Serviceman("1", new FullName("Петров Петро Петрович"));
      const s2 = new Serviceman("2", new FullName("Іванов Іван Іванович"));

      expect(s1.equals(s2)).toBe(false);
    });
  });

  describe("fromRaw", () => {
    it("should create a Serviceman from raw data with fullName and militaryRank", () => {
      const raw = { fullName: "Петров Петро Петрович", militaryRank: "Sergeant" };
      const serviceman = Serviceman.fromRaw(raw);

      expect(serviceman.id).toBe("uuid-mock"); // uuid is mocked
      expect(serviceman.fullName.toString()).toBe("ПЕТРОВ Петро Петрович");
      expect(serviceman.militaryRank).toBe("Sergeant");
    });

    it("should create a Serviceman from raw data without militaryRank", () => {
      const raw = { fullName: "Іванов Іван Іванович" };
      const serviceman = Serviceman.fromRaw(raw);

      expect(serviceman.id).toBe("uuid-mock");
      expect(serviceman.fullName.toString()).toBe("ІВАНОВ Іван Іванович");
      expect(serviceman.militaryRank).toBeUndefined();
    });
  });
});
