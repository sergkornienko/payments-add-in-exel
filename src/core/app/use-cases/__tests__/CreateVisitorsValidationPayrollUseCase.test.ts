import { CreateVisitorsValidationPayrollUseCase } from "../CreateVisitorsValidationPayrollUseCase";
import { UseCaseResult } from "../UseCaseResult";
import { MonthStringSchema } from "../validation/RawInstructorsDataValidation";

const mockPayrollTableReader = {
  read: jest.fn(),
};
const mockVisitorsTableReader = {
  read: jest.fn(),
};
const mockPayrollTableRenderer = {
  render: jest.fn(),
};

describe("CreateVisitorsValidationPayrollUseCase", () => {
  let useCase: CreateVisitorsValidationPayrollUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateVisitorsValidationPayrollUseCase(
      mockPayrollTableReader as any,
      mockVisitorsTableReader as any,
      mockPayrollTableRenderer as any
    );
  });

  describe("validateVisitors", () => {
    it("should call both table readers and renderer", async () => {
      const rawData = [
        {
          fullName: "Іванов Іван Іванович",
          militaryRank: "полковник",
          "01.09.2024": 100,
        },
      ];
      const rawVisitorsData = [
        {
          fullName: "Іванов Іван Іванович",
          militaryRank: "полковник",
          "01.09.2024": 100,
        },
      ];

      mockPayrollTableReader.read.mockResolvedValue(rawData);
      mockVisitorsTableReader.read.mockResolvedValue(rawVisitorsData);

      const result = await useCase.validateVisitors("09.2024");

      expect(mockPayrollTableReader.read).toHaveBeenCalled();
      expect(mockVisitorsTableReader.read).toHaveBeenCalled();
      expect(mockPayrollTableRenderer.render).toHaveBeenCalled();
      expect(result).toEqual(UseCaseResult.Ok());
    });

    it("should return validation error when monthAndYear is invalid", async () => {
      const result = await useCase.validateVisitors("invalid-month");

      expect(result.isError()).toBeTruthy();
    });

    it("should return use case error result when throws error", async () => {
      mockPayrollTableReader.read.mockRejectedValue(new Error("read error"));
      const result = await useCase.validateVisitors("09.2024");

      expect(result).toEqual(UseCaseResult.UnknownError());
    });
  });
});
