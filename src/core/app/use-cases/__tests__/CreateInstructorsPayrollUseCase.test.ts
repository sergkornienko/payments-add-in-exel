import { CreateInstructorsPayrollUseCase } from "../CreateInstructorsPayrollUseCase";
import { v4 as uuidv4 } from "uuid";
import { UseCaseResult } from "../UseCaseResult";

// Mock uuid so tests are predictable
jest.mock("uuid", () => ({ v4: () => "uuid-mock" }));
// Mock dependencies
const mockRead = jest.fn();
const mockRender = jest.fn();

const mockTableReader = {
  read: mockRead,
};

const mockTableRenderer = {
  render: mockRender,
};

describe("CreateInstructorsPayrollUseCase", () => {
  let useCase: CreateInstructorsPayrollUseCase;
  const month = "01.2026";

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateInstructorsPayrollUseCase(mockTableReader as any, mockTableRenderer as any);
  });

  describe("execute", () => {
    it("should call tableReader.read and tableRenderer.render with parsed items", async () => {
      const rawData = [
        { militaryRank: "солдат", fullName: "Петров Петро Петрович", dates: "05 (2), 06 (3)" },
        {
          militaryRank: "сержант",
          fullName: "Слюнько Віта Іванівна",
          dates: "15 (7), 17 (4), 18 (1)",
        },
      ];
      mockRead.mockResolvedValue(rawData);

      await useCase.execute(month);

      // Check that the reader was called
      expect(mockRead).toHaveBeenCalled();

      // Check renderer call
      expect(mockRender).toHaveBeenCalledWith([
        {
          militaryRank: "солдат",
          fullName: "ПЕТРОВ Петро Петрович",
          days: 2,
          dateRange: "з 05.01.2026 по 06.01.2026",
          "05.01.2026": 30,
          "06.01.2026": 30,
        },
        {
          militaryRank: "сержант",
          fullName: "СЛЮНЬКО Віта Іванівна",
          days: 3,
          dateRange: "за 15.01.2026; з 17.01.2026 по 18.01.2026",
          "15.01.2026": 30,
          "17.01.2026": 30,
          "18.01.2026": 30,
        },
      ]);
    });

    it("should return use case error result when throws error", async () => {
      mockRead.mockRejectedValue(new Error("read error"));
      const result = await useCase.execute(month);

      expect(result.isError()).toBeTruthy();
    });

    it("should return validation error when input data not correct", async () => {
      mockRead.mockResolvedValue([{ militaryRank: "солдат", fullName: "Петров Петро Петрович" }]);
      const result = await useCase.execute(month);

      expect(result.isError()).toBeTruthy();
    });

    it("should return validation error when month not correct", async () => {
      mockRead.mockResolvedValue([]);
      const result = await useCase.execute("month");

      expect(result.isError()).toBeTruthy();
    });
  });
});
