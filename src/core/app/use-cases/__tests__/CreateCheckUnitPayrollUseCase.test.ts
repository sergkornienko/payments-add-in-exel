import { CreateCheckUnitPayrollUseCase } from "../CreateCheckUnitPayrollUseCase";
import { UseCaseResult } from "../UseCaseResult";
import { MonthStringSchema } from "../validation/RawInstructorsDataValidation";


const mockPayrollTableReader = {
  read: jest.fn(),
};
const mockReport30TableReader = {
  read: jest.fn(),
};
const mockReport50TableReader = {
  read: jest.fn(),
};
const mockReport70TableReader = {
  read: jest.fn(),
};
const mockReport100TableReader = {
  read: jest.fn(),
};
const mockPayrollTableRenderer = {
  render: jest.fn(),
};
const mockRawPayrollDataVerifier = {
  verify: jest.fn(),
};

describe("CreateCheckUnitPayrollUseCase", () => {
  let useCase: CreateCheckUnitPayrollUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateCheckUnitPayrollUseCase(
      mockPayrollTableReader as any,
      mockReport30TableReader as any,
      mockReport50TableReader as any,
      mockReport70TableReader as any,
      mockReport100TableReader as any,
      mockPayrollTableRenderer as any,
      mockRawPayrollDataVerifier as any
    );
  });

  describe("checkUnitPayroll", () => {
    it("should call all table readers and verifier", async () => {
      const rawData = [
        {
          taxPayerId: "1234567890",
          fullName: "Іванов Іван Іванович",
          militaryRank: "полковник",
          "01.09.2024": 100,
        },
      ];
      const reportData = [
        {
          fullName: "Іванов Іван Іванович",
          militaryRank: "полковник",
          dates: "01.09.2024",
        },
      ];

      mockPayrollTableReader.read.mockResolvedValue(rawData);
      mockReport30TableReader.read.mockResolvedValue(reportData);
      mockReport50TableReader.read.mockResolvedValue(reportData);
      mockReport70TableReader.read.mockResolvedValue(reportData);
      mockReport100TableReader.read.mockResolvedValue(reportData);
      mockRawPayrollDataVerifier.verify.mockResolvedValue(new Map());

      const result = await useCase.checkUnitPayroll("09.2024");

      expect(mockPayrollTableReader.read).toHaveBeenCalled();
      expect(mockReport30TableReader.read).toHaveBeenCalled();
      expect(mockReport50TableReader.read).toHaveBeenCalled();
      expect(mockReport70TableReader.read).toHaveBeenCalled();
      expect(mockReport100TableReader.read).toHaveBeenCalled();
      expect(mockRawPayrollDataVerifier.verify).toHaveBeenCalled();
      expect(mockPayrollTableRenderer.render).toHaveBeenCalled();
      expect(result).toEqual(UseCaseResult.Ok());
    });

    it("should return validation error when monthAndYear is invalid", async () => {
      const result = await useCase.checkUnitPayroll("invalid-month");

      expect(result.isError()).toBeTruthy();
    });

    it("should return use case error result when throws error", async () => {
      mockPayrollTableReader.read.mockRejectedValue(new Error("read error"));
      const result = await useCase.checkUnitPayroll("09.2024");

      expect(result).toEqual(UseCaseResult.UnknownError());
    });
  });
});
