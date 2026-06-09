
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

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface OrderStatsResponse {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  totalSpentFormatted: string;
  averageOrderValueFormatted: string;
  statusBreakdown: Array<{
    status: string;
    count: number;
  }>;
}

export interface OrderStatusHistoryResponse {
  id: number;
  orderId: number;
  oldStatus: string | null;
  newStatus: string;
  changedBy: number;
  reason: string | null;
  createdAt: Date;
  changedByUser: {
    id: number;
    first_name: string;
    last_name: string;
    role: string;
  } | null;
}

export interface OrderResponse {
  id: number;
  buyerId: number;
  totalAmount: number;
  status: string;
  shippingAddress?: string;
  notes?: string;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  cancelledAt?: Date;
  buyer?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
  orderItems: Array<{
    id: number;
    productId: number;
    quantity: number;
    unitPrice: number;
    product: {
      id: number;
      name: string;
      unit: string;
      farmer?: {
        id: number;
        first_name: string;
        last_name: string;
        phone?: string;
      };
    };
  }>;
}

export interface PaginatedOrdersResponse {
  orders: OrderResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}