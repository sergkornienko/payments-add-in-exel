import { CreateAuditUseCase } from "../CreateAuditUseCase";
import { UseCaseResult } from "../UseCaseResult";

const mockTableReader = {
  read: jest.fn(),
  getSelected: jest.fn(),
};
const mockDocumentPopulator = {
  populate: jest.fn(),
};

describe("CreateAuditUseCase", () => {
  let useCase: CreateAuditUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateAuditUseCase(mockTableReader as any, mockDocumentPopulator as any);
  });

  describe("calculatePeriod", () => {
    it("should call tableReader.getSelected and calculate sum", async () => {
      const selectedValues = {
        values: ["1000", "2000", "3000"],
        header: ["01.09.2024", "02.09.2024", "03.09.2024"],
      };

      mockTableReader.getSelected.mockResolvedValue(selectedValues);

      const result = await useCase.calculatePeriod();

      expect(mockTableReader.getSelected).toHaveBeenCalled();
      expect(result.message).toEqual("200000.00"); // Exact calculated value
    });

    it("should return use case error result when throws error", async () => {
      mockTableReader.getSelected.mockRejectedValue(new Error("read error"));
      const result = await useCase.calculatePeriod();

      expect(result).toEqual(UseCaseResult.UnknownError());
    });
  });

  describe("createParticipationCertificate", () => {
    it("should call tableReader.read and documentPopulator.populate", async () => {
      const rawRowData = {
        fullName: "Іванов Іван Іванович",
        militaryRank: "післяник",
        "27.03.2023": 100,
        "28.03.2023": 100,
        "29.03.2023": 100,
        "30.03.2023": 100,
        "31.03.2023": 100,
      };
      const values = [rawRowData, { "01.01.2024": 0 }];

      mockTableReader.read.mockResolvedValue(values);

      await useCase.createParticipationCertificate("2");

      expect(mockTableReader.read).toHaveBeenCalled();
      expect(mockDocumentPopulator.populate).toHaveBeenCalled();
    });

    it("should return use case error result when throws error", async () => {
      mockTableReader.read.mockRejectedValue(new Error("read error"));
      const result = await useCase.createParticipationCertificate("1");

      expect(result).toEqual(UseCaseResult.UnknownError());
    });
  });
});
