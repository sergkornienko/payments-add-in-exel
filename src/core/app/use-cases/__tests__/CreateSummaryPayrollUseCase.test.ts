import { CreateSummaryPayrollUseCase } from "../CreateSummaryPayrollUseCase";
import { UseCaseResult } from "../UseCaseResult";
import { MonthStringSchema } from "../validation/RawInstructorsDataValidation";

// Mock dependencies
const mockTableReader = {
  read: jest.fn(),
};
const mockReasonsMapReader = {
  read: jest.fn(),
};
const mockOverlapsTableRenderer = {
  render: jest.fn(),
};
const mockTable30Renderer = {
  render: jest.fn(),
};
const mockTable50Renderer = {
  render: jest.fn(),
};
const mockTable70Renderer = {
  render: jest.fn(),
};
const mockTable100Renderer = {
  render: jest.fn(),
};

describe("CreateSummaryPayrollUseCase", () => {
  let useCase: CreateSummaryPayrollUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateSummaryPayrollUseCase(
      mockTableReader as any,
      mockReasonsMapReader as any,
      mockOverlapsTableRenderer as any,
      mockTable30Renderer as any,
      mockTable50Renderer as any,
      mockTable70Renderer as any,
      mockTable100Renderer as any
    );
  });

  describe("generateSummary", () => {
    it("should call tableReader.read and reasonsMapReader.read", async () => {
      const rawData = [
        {
          fullName: "Іванов Іван Іванович",
          militaryRank: "пーヨтор",
          taxPayerId: "1234567890",
          "01.09.2024": 100,
          "02.09.2024": 100,
        },
      ];
      const reasons = [{ id: "1", description: "Test reason" }];

      mockTableReader.read.mockResolvedValue(rawData);
      mockReasonsMapReader.read.mockResolvedValue(reasons);

      const result = await useCase.generateSummary("09.2024");

      expect(mockTableReader.read).toHaveBeenCalled();
      expect(mockReasonsMapReader.read).toHaveBeenCalled();
      // Since we're not mocking the internal services completely,
      // we just check that it doesn't throw and returns a result
      expect(result).toEqual(expect.any(UseCaseResult));
    });

    it("should return validation error when monthAndYear is invalid", async () => {
      // Mock uuid so tests are predictable
      jest.mock("uuid", () => ({ v4: () => "uuid-mock" }));

      const result = await useCase.generateSummary("invalid-month");

      // MonthStringSchema.parse will throw ZodError, which handleError should catch
      expect(result.isError()).toBeTruthy();
    });

    it("should return use case error result when throws error", async () => {
      mockTableReader.read.mockRejectedValue(new Error("read error"));
      const result = await useCase.generateSummary("09.2024");

      expect(result).toEqual(UseCaseResult.UnknownError());
    });
  });

  describe("check", () => {
    it("should call tableReader.read", async () => {
      const rawData = [
        {
          fullName: "Іванов Іван Іванович",
          militaryRank: "п<tool_call>онець",
          taxPayerId: "1234567890",
          "01.09.2024": 100,
        },
      ];

      mockTableReader.read.mockResolvedValue(rawData);

      await useCase.check("09.2024");

      expect(mockTableReader.read).toHaveBeenCalled();
    });

    it("should return error when monthAndYear is invalid", async () => {
      // Since check() returns Promise<void>, we need to catch the error
      await expect(useCase.check("invalid-month")).rejects.toThrow();
    });
  });
});