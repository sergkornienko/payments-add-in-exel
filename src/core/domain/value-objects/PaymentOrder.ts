export interface PaymentOrder {
  name: string;
  year: number;
}

export const createPaymentOrdersFromString = (orders: string): PaymentOrder[] =>
  orders
    .split(";")
    .map((s) => {
      if (!s) {
        return;
      }
      const match = s.match(/(\d{2})\.(\d{2})\.(\d{4})/);

      if (!match || match.length < 1) {
        console.log("orders with error", { orders });
      }

      const month = Number(match[2]);
      let orderYear = Number(match[3]);

      if (month === 1) {
        orderYear -= 1;
      }

      return {
        name: s.trim(),
        year: Number(orderYear),
      };
    })
    .filter((s) => s);
