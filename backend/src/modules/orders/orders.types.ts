export interface OrderItemInput {
  productId: number;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  totalAmount: number;
  shippingAddress?: string;
  notes?: string;
}

export interface UpdateOrderStatusInput {
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  trackingNumber?: string;
}