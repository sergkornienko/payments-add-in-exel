import { Create70PayrollUseCase } from "../Create70PayrollUseCase";
import { ITableReader, SelectedValues } from "../../ports/ITableReader";
import { ITableRenderer } from "../../ports/ITableRenderer";
import { Raw70InitialData } from "../../../domain/value-objects/Raw70InitialData";
import { Raw70PayrollData } from "../../../domain/value-objects/Raw70PayrollData";
import { PayrollRenderItem } from "../../../domain/value-objects/PayrollRenderItem";
import { RewardAccrualRenderItem } from "../../../domain/value-objects/RewardAccrualRenderItem";

// Mock implementations
class MockTableReader<T> implements ITableReader<T> {
  constructor(private data: T[]) {}
  async read(): Promise<T[]> {
    return Promise.resolve(this.data);
  }
  async getSelected(): Promise<SelectedValues<T>> {
    return Promise.resolve({ values: [], header: [] });
  }
}

class MockTableRenderer<T> implements ITableRenderer<T> {
  public renderedData: T[] = [];

  async render(data: T[]): Promise<void> {
    this.renderedData = data;
    return Promise.resolve();
  }
}

describe("Create70PayrollUseCase", () => {
  let useCase: Create70PayrollUseCase;
  let mockInitialReader: MockTableReader<Raw70InitialData>;
  let mockPayrollsReader: MockTableReader<Raw70PayrollData>;
  let mockOrderReader: MockTableReader<PayrollRenderItem>;
  let mockRewardAccrualRenderer: MockTableRenderer<RewardAccrualRenderItem>;
  let mockPayrollRenderer: MockTableRenderer<PayrollRenderItem>;
  let mockNewServicemansRenderer: MockTableRenderer<Raw70InitialData>;
  let mockInitialRenderer: MockTableRenderer<Raw70InitialData>;

  beforeEach(() => {
    mockInitialReader = new MockTableReader<Raw70InitialData>([]);
    mockPayrollsReader = new MockTableReader<Raw70PayrollData>([]);
    mockOrderReader = new MockTableReader<PayrollRenderItem>([]);
    mockRewardAccrualRenderer = new MockTableRenderer<RewardAccrualRenderItem>();
    mockPayrollRenderer = new MockTableRenderer<PayrollRenderItem>();
    mockNewServicemansRenderer = new MockTableRenderer<Raw70InitialData>();
    mockInitialRenderer = new MockTableRenderer<Raw70InitialData>();

    useCase = new Create70PayrollUseCase(
      mockInitialReader,
      mockPayrollsReader,
      mockOrderReader,
      mockRewardAccrualRenderer,
      mockPayrollRenderer,
      mockNewServicemansRenderer,
      mockInitialRenderer
    );
  });

  describe("addOrder", () => {
    it("should add order text when serviceman has matching days in order data", async () => {
      const initialData: Raw70InitialData[] = [
        {
          taxPayerId: "123456789",
          fullName: "Іван Петренко",
          paymentsOrders: "",
        } as Raw70InitialData,
      ];

      const orderData: PayrollRenderItem[] = [
        {
          taxPayerId: "123456789",
          days: 3,
        } as PayrollRenderItem,
      ];

      mockInitialReader = new MockTableReader(initialData);
      mockOrderReader = new MockTableReader(orderData);

      useCase = new Create70PayrollUseCase(
        mockInitialReader,
        mockPayrollsReader,
        mockOrderReader,
        mockRewardAccrualRenderer,
        mockPayrollRenderer,
        mockNewServicemansRenderer,
        mockInitialRenderer
      );

      await useCase.addOrder("Наказ №123");

      expect(mockInitialRenderer.renderedData).toHaveLength(1);
      expect(mockInitialRenderer.renderedData[0].paymentsOrders).toBe(
        "Наказ №123; Наказ №123; Наказ №123"
      );
    });

    it("should append order text when serviceman already has existing orders", async () => {
      const initialData: Raw70InitialData[] = [
        {
          taxPayerId: "123456789",
          fullName: "Іван Петренко",
          paymentsOrders: "Наказ №100",
        } as Raw70InitialData,
      ];

      const orderData: PayrollRenderItem[] = [
        {
          taxPayerId: "123456789",
          days: 2,
        } as PayrollRenderItem,
      ];

      mockInitialReader = new MockTableReader(initialData);
      mockOrderReader = new MockTableReader(orderData);

      useCase = new Create70PayrollUseCase(
        mockInitialReader,
        mockPayrollsReader,
        mockOrderReader,
        mockRewardAccrualRenderer,
        mockPayrollRenderer,
        mockNewServicemansRenderer,
        mockInitialRenderer
      );

      await useCase.addOrder("Наказ №200");

      expect(mockInitialRenderer.renderedData[0].paymentsOrders).toBe(
        "Наказ №100; Наказ №200; Наказ №200"
      );
    });

    it("should not modify paymentsOrders when serviceman has no matching order data", async () => {
      const initialData: Raw70InitialData[] = [
        {
          taxPayerId: "123456789",
          fullName: "Іван Петренко",
          paymentsOrders: "Наказ №100",
        } as Raw70InitialData,
      ];

      const orderData: PayrollRenderItem[] = [
        {
          taxPayerId: "987654321", // Different tax payer
          days: 2,
        } as PayrollRenderItem,
      ];

      mockInitialReader = new MockTableReader(initialData);
      mockOrderReader = new MockTableReader(orderData);

      useCase = new Create70PayrollUseCase(
        mockInitialReader,
        mockPayrollsReader,
        mockOrderReader,
        mockRewardAccrualRenderer,
        mockPayrollRenderer,
        mockNewServicemansRenderer,
        mockInitialRenderer
      );

      await useCase.addOrder("Наказ №200");

      expect(mockInitialRenderer.renderedData[0].paymentsOrders).toBe("Наказ №100");
    });

    it("should handle empty paymentsOrders when adding first order", async () => {
      const initialData: Raw70InitialData[] = [
        {
          taxPayerId: "123456789",
          fullName: "Іван Петренко",
          paymentsOrders: "",
        } as Raw70InitialData,
      ];

      const orderData: PayrollRenderItem[] = [
        {
          taxPayerId: "123456789",
          days: 1,
        } as PayrollRenderItem,
      ];

      mockInitialReader = new MockTableReader(initialData);
      mockOrderReader = new MockTableReader(orderData);

      useCase = new Create70PayrollUseCase(
        mockInitialReader,
        mockPayrollsReader,
        mockOrderReader,
        mockRewardAccrualRenderer,
        mockPayrollRenderer,
        mockNewServicemansRenderer,
        mockInitialRenderer
      );

      await useCase.addOrder("Наказ №123");

      expect(mockInitialRenderer.renderedData[0].paymentsOrders).toBe("Наказ №123");
    });

    it("should handle undefined paymentsOrders when adding first order", async () => {
      const initialData: Raw70InitialData[] = [
        {
          taxPayerId: "123456789",
          fullName: "Іван Петренко",
          paymentsOrders: undefined,
        } as Raw70InitialData,
      ];

      const orderData: PayrollRenderItem[] = [
        {
          taxPayerId: "123456789",
          days: 1,
        } as PayrollRenderItem,
      ];

      mockInitialReader = new MockTableReader(initialData);
      mockOrderReader = new MockTableReader(orderData);

      useCase = new Create70PayrollUseCase(
        mockInitialReader,
        mockPayrollsReader,
        mockOrderReader,
        mockRewardAccrualRenderer,
        mockPayrollRenderer,
        mockNewServicemansRenderer,
        mockInitialRenderer
      );

      await useCase.addOrder("Наказ №123");

      expect(mockInitialRenderer.renderedData[0].paymentsOrders).toBe("Наказ №123");
    });

    it("should handle taxPayerId with leading/trailing whitespace", async () => {
      const initialData: Raw70InitialData[] = [
        {
          taxPayerId: "  123456789  ",
          fullName: "Іван Петренко",
          paymentsOrders: "",
        } as Raw70InitialData,
      ];

      const orderData: PayrollRenderItem[] = [
        {
          taxPayerId: "123456789",
          days: 2,
        } as PayrollRenderItem,
      ];

      mockInitialReader = new MockTableReader(initialData);
      mockOrderReader = new MockTableReader(orderData);

      useCase = new Create70PayrollUseCase(
        mockInitialReader,
        mockPayrollsReader,
        mockOrderReader,
        mockRewardAccrualRenderer,
        mockPayrollRenderer,
        mockNewServicemansRenderer,
        mockInitialRenderer
      );

      await useCase.addOrder("Наказ №123");

      expect(mockInitialRenderer.renderedData[0].paymentsOrders).toBe("Наказ №123; Наказ №123");
    });

    it("should handle numeric taxPayerId", async () => {
      const initialData: Raw70InitialData[] = [
        {
          // @ts-ignore
          taxPayerId: 123456789,
          fullName: "Іван Петренко",
          paymentsOrders: "",
          militaryRank: "солдат",
          unit: "",
          position: "",
        },
      ];

      const orderData: PayrollRenderItem[] = [
        {
          taxPayerId: "123456789",
          days: 1,
        } as PayrollRenderItem,
      ];

      mockInitialReader = new MockTableReader(initialData);
      mockOrderReader = new MockTableReader(orderData);

      useCase = new Create70PayrollUseCase(
        mockInitialReader,
        mockPayrollsReader,
        mockOrderReader,
        mockRewardAccrualRenderer,
        mockPayrollRenderer,
        mockNewServicemansRenderer,
        mockInitialRenderer
      );

      await useCase.addOrder("Наказ №123");

      expect(mockInitialRenderer.renderedData[0].paymentsOrders).toBe("Наказ №123");
    });

    it("should handle multiple servicemen with different days", async () => {
      const initialData: Raw70InitialData[] = [
        {
          taxPayerId: "111111111",
          fullName: "Іван Петренко",
          paymentsOrders: "",
        } as Raw70InitialData,
        {
          taxPayerId: "222222222",
          fullName: "Петро Іваненко",
          paymentsOrders: "Наказ №100",
        } as Raw70InitialData,
        {
          taxPayerId: "333333333",
          fullName: "Марія Сидоренко",
          paymentsOrders: "",
        } as Raw70InitialData,
      ];

      const orderData: PayrollRenderItem[] = [
        { taxPayerId: "111111111", days: 1 } as PayrollRenderItem,
        { taxPayerId: "222222222", days: 3 } as PayrollRenderItem,
        { taxPayerId: "333333333", days: 2 } as PayrollRenderItem,
      ];

      mockInitialReader = new MockTableReader(initialData);
      mockOrderReader = new MockTableReader(orderData);

      useCase = new Create70PayrollUseCase(
        mockInitialReader,
        mockPayrollsReader,
        mockOrderReader,
        mockRewardAccrualRenderer,
        mockPayrollRenderer,
        mockNewServicemansRenderer,
        mockInitialRenderer
      );

      await useCase.addOrder("Наказ №200");

      expect(mockInitialRenderer.renderedData).toHaveLength(3);
      expect(mockInitialRenderer.renderedData[0].paymentsOrders).toBe("Наказ №200");
      expect(mockInitialRenderer.renderedData[1].paymentsOrders).toBe(
        "Наказ №100; Наказ №200; Наказ №200; Наказ №200"
      );
      expect(mockInitialRenderer.renderedData[2].paymentsOrders).toBe("Наказ №200; Наказ №200");
    });

    it("should not add order when days is zero", async () => {
      const initialData: Raw70InitialData[] = [
        {
          taxPayerId: "123456789",
          fullName: "Іван Петренко",
          paymentsOrders: "Наказ №100",
        } as Raw70InitialData,
      ];

      const orderData: PayrollRenderItem[] = [
        {
          taxPayerId: "123456789",
          days: 0,
        } as PayrollRenderItem,
      ];

      mockInitialReader = new MockTableReader(initialData);
      mockOrderReader = new MockTableReader(orderData);

      useCase = new Create70PayrollUseCase(
        mockInitialReader,
        mockPayrollsReader,
        mockOrderReader,
        mockRewardAccrualRenderer,
        mockPayrollRenderer,
        mockNewServicemansRenderer,
        mockInitialRenderer
      );

      await useCase.addOrder("Наказ №200");

      expect(mockInitialRenderer.renderedData[0].paymentsOrders).toBe("Наказ №100");
    });

    it("should handle empty initial data", async () => {
      mockInitialReader = new MockTableReader([]);
      mockOrderReader = new MockTableReader([]);

      useCase = new Create70PayrollUseCase(
        mockInitialReader,
        mockPayrollsReader,
        mockOrderReader,
        mockRewardAccrualRenderer,
        mockPayrollRenderer,
        mockNewServicemansRenderer,
        mockInitialRenderer
      );

      await useCase.addOrder("Наказ №123");

      expect(mockInitialRenderer.renderedData).toHaveLength(0);
    });

    it("should handle empty order data", async () => {
      const initialData: Raw70InitialData[] = [
        {
          taxPayerId: "123456789",
          fullName: "Іван Петренко",
          paymentsOrders: "Наказ №100",
        } as Raw70InitialData,
      ];

      mockInitialReader = new MockTableReader(initialData);
      mockOrderReader = new MockTableReader([]);

      useCase = new Create70PayrollUseCase(
        mockInitialReader,
        mockPayrollsReader,
        mockOrderReader,
        mockRewardAccrualRenderer,
        mockPayrollRenderer,
        mockNewServicemansRenderer,
        mockInitialRenderer
      );

      await useCase.addOrder("Наказ №200");

      expect(mockInitialRenderer.renderedData[0].paymentsOrders).toBe("Наказ №100");
    });

    it("should return Ok result when operation succeeds", async () => {
      mockInitialReader = new MockTableReader([]);
      mockOrderReader = new MockTableReader([]);

      useCase = new Create70PayrollUseCase(
        mockInitialReader,
        mockPayrollsReader,
        mockOrderReader,
        mockRewardAccrualRenderer,
        mockPayrollRenderer,
        mockNewServicemansRenderer,
        mockInitialRenderer
      );

      const result = await useCase.addOrder("Наказ №123");

      expect(result.isError()).toBe(false);
    });

    it("should call renderer with updated data", async () => {
      const initialData: Raw70InitialData[] = [
        {
          taxPayerId: "123456789",
          fullName: "Іван Петренко",
          paymentsOrders: "",
        } as Raw70InitialData,
      ];

      const orderData: PayrollRenderItem[] = [
        {
          taxPayerId: "123456789",
          days: 2,
        } as PayrollRenderItem,
      ];

      mockInitialReader = new MockTableReader(initialData);
      mockOrderReader = new MockTableReader(orderData);

      useCase = new Create70PayrollUseCase(
        mockInitialReader,
        mockPayrollsReader,
        mockOrderReader,
        mockRewardAccrualRenderer,
        mockPayrollRenderer,
        mockNewServicemansRenderer,
        mockInitialRenderer
      );

      await useCase.addOrder("Наказ №123");

      expect(mockInitialRenderer.renderedData).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            taxPayerId: "123456789",
            fullName: "Іван Петренко",
            paymentsOrders: "Наказ №123; Наказ №123",
          }),
        ])
      );
    });
  });
});
