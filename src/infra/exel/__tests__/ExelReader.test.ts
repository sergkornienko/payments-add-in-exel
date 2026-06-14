import { ExcelReader } from "../ExelReader";

const createMockExcelContext = (rangeValues, startRowIndex = 0, startColIndex = 0) => {
  const mockRange: any = {
    load: jest.fn().mockImplementation((props) => {
      mockRange.requestedProps = props;
      return Promise.resolve();
    }),
    values: [],
    rowIndex: startRowIndex,
    columnIndex: startColIndex,
  };

  const mockWorksheet = {
    getUsedRange: jest.fn().mockReturnValue(mockRange),
  };

  const mockContext = {
    workbook: {
      worksheets: {
        getActiveWorksheet: jest.fn().mockReturnValue(mockWorksheet),
        getItemOrNullObject: jest.fn().mockReturnValue({
          isNullObject: false,
        }),
      },
    },
    sync: jest.fn().mockImplementation(() => {
      if (mockRange.requestedProps) {
        if (mockRange.requestedProps.includes("values")) {
          mockRange.values = rangeValues;
        }
        if (mockRange.requestedProps.includes("rowIndex")) {
          mockRange.rowIndex = startRowIndex;
        }
        if (mockRange.requestedProps.includes("columnIndex")) {
          mockRange.columnIndex = startColIndex;
        }
      }
      return Promise.resolve();
    }),
  };

  return { mockContext, mockRange, mockWorksheet };
};

describe("ExcelReader", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    (global as any).Excel = {
      run: jest.fn().mockImplementation((callback) => {
        if ((global as any)._currentMockContext) {
          return callback((global as any)._currentMockContext);
        }
        return callback({});
      }),
    };
  });

  describe("read()", () => {
    it("should read string values correctly when no type specified", async () => {
      const rangeValues = [
        ["Name", "Value"],
        ["Test", "123"],
        ["Another", "456"],
      ];
      const startRowIndex = 0;
      const startColIndex = 0;
      const mockResult = createMockExcelContext(rangeValues, startRowIndex, startColIndex);

      (global as any)._currentMockContext = mockResult.mockContext;

      const schema = {
        startRow: 2,
        fields: [
          { name: "name", column: "A" },
          { name: "value", column: "B" },
        ],
      };
      const reader = new ExcelReader(schema);
      const result = await reader.read();

      expect(result).toEqual([
        { name: "Test", value: "123" },
        { name: "Another", value: "456" },
      ]);
    });

    it("should return empty array when no data found", async () => {
      const rangeValues = [["Name", "Value"]];
      const startRowIndex = 0;
      const startColIndex = 0;
      const mockResult = createMockExcelContext(rangeValues, startRowIndex, startColIndex);

      (global as any)._currentMockContext = mockResult.mockContext;

      const schema = {
        startRow: 3,
        fields: [
          { name: "name", column: "A" },
          { name: "value", column: "B" },
        ],
      };
      const reader = new ExcelReader(schema);

      const result = await reader.read();

      expect(result).toEqual([]);
    });

    it("should handle null/undefined values correctly", async () => {
      const rangeValues = [
        ["Name", "Value"],
        ["Test", null],
        [undefined, "456"],
      ];
      const startRowIndex = 0;
      const startColIndex = 0;
      const mockResult = createMockExcelContext(rangeValues, startRowIndex, startColIndex);

      (global as any)._currentMockContext = mockResult.mockContext;

      const schema = {
        startRow: 2,
        fields: [
          { name: "name", column: "A" },
          { name: "value", column: "B" },
        ],
      };
      const reader = new ExcelReader(schema);
      const result = await reader.read();

      expect(result).toEqual([
        { name: "Test", value: null },
        { name: null, value: "456" },
      ]);
    });

    it("should convert Excel date serial numbers to formatted strings when type is date", async () => {
      const rangeValues = [["DateField"], [44562]];
      const startRowIndex = 0;
      const startColIndex = 0;
      const mockResult = createMockExcelContext(rangeValues, startRowIndex, startColIndex);

      (global as any)._currentMockContext = mockResult.mockContext;

      const schema = {
        startRow: 2,
        fields: [{ name: "dateField", column: "A", type: "date" as const }],
      };
      const reader = new ExcelReader(schema);
      const result = await reader.read();

      expect(result).toEqual([{ dateField: "01.01.2022" }]);
    });

    it("should not convert non-date numbers when type is date", async () => {
      const rangeValues = [["Amount"], [123.45]];
      const startRowIndex = 0;
      const startColIndex = 0;
      const mockResult = createMockExcelContext(rangeValues, startRowIndex, startColIndex);

      (global as any)._currentMockContext = mockResult.mockContext;

      const schema = {
        startRow: 2,
        fields: [{ name: "amount", column: "A", type: "date" as const }],
      };
      const reader = new ExcelReader(schema);
      const result = await reader.read();

      expect(result).toEqual([{ amount: 123.45 }]);
    });

    it("should handle invalid Excel dates gracefully", async () => {
      const rangeValues = [["DateField"], [-1]];
      const startRowIndex = 0;
      const startColIndex = 0;
      const mockResult = createMockExcelContext(rangeValues, startRowIndex, startColIndex);

      (global as any)._currentMockContext = mockResult.mockContext;

      const schema = {
        startRow: 2,
        fields: [{ name: "dateField", column: "A", type: "date" as const }],
      };
      const reader = new ExcelReader(schema);
      const result = await reader.read();
      expect(result).toEqual([{ dateField: -1 }]);
    });
  });
});
