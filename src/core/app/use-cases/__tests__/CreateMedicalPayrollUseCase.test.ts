import { CreateMedicalPayrollUseCase } from "../CreateMedicalPayrollUseCase";
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

describe("CreateMedicalPayrollUseCase", () => {
  let useCase: CreateMedicalPayrollUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateMedicalPayrollUseCase(mockTableReader as any, mockTableRenderer as any);
  });

  describe("execute", () => {
    it("should call tableReader.read and tableRenderer.render with parsed items", async () => {
      const rawData = [
        { militaryRank: "солдат", fullName: "Петров Петро Петрович", dates: "01.01.2024" },
        {
          militaryRank: "сержант",
          fullName: "Слюнько Віта Іванівна",
          dates: "31.01.2024 - 02.02.2024",
        },
        { militaryRank: "солдат", fullName: "Петров Петро Петрович", dates: "01.02.2024" },
      ];
      mockRead.mockResolvedValue(rawData);

      await useCase.execute();

      // Check that the reader was called
      expect(mockRead).toHaveBeenCalled();

      // Check renderer call
      expect(mockRender).toHaveBeenCalledWith([
        {
          militaryRank: "солдат",
          fullName: "ПЕТРОВ Петро Петрович",
          days: 1,
          dateRange: "за 01.01.2024",
          "01.01.2024": 100,
        },
        {
          militaryRank: "солдат",
          fullName: "ПЕТРОВ Петро Петрович",
          days: 1,
          dateRange: "за 01.02.2024",
          "01.02.2024": 100,
        },
        {
          militaryRank: "сержант",
          fullName: "СЛЮНЬКО Віта Іванівна",
          days: 1,
          dateRange: "за 31.01.2024",
          "31.01.2024": 100,
        },
        {
          militaryRank: "сержант",
          fullName: "СЛЮНЬКО Віта Іванівна",
          days: 2,
          dateRange: "з 01.02.2024 по 02.02.2024",
          "01.02.2024": 100,
          "02.02.2024": 100,
        },
      ]);
    });

    it("should return use case error result when throws error", async () => {
      mockRead.mockRejectedValue(new Error("read error"));
      const result = await useCase.execute();

      expect(result).toEqual(UseCaseResult.UnknownError());
    });

    it("should return validation error when input data not correct", async () => {
      mockRead.mockResolvedValue([{ militaryRank: "солдат", fullName: "Петров Петро Петрович" }]);
      const result = await useCase.execute();

      expect(result.isError()).toBeTruthy();
    });
  });
});
