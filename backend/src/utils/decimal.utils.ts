// decimal.utils.ts
import { Prisma } from '@prisma/client';

export function toNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return value.toNumber();
}

export function convertOrderDecimals(order: any): any {
  if (!order) return order;
  
  return {
    ...order,
    totalAmount: toNumber(order.totalAmount),
    orderItems: order.orderItems?.map((item: any) => ({
      ...item,
      quantity: toNumber(item.quantity),
      unitPrice: toNumber(item.unitPrice)
    })) || []
  };
}

export function convertOrdersDecimals(orders: any[]): any[] {
  return orders.map(order => convertOrderDecimals(order));
}