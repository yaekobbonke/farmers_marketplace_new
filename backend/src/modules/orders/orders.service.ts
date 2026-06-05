import { PrismaClient, OrderStatus } from '@prisma/client';
import prisma from "../../config/prisma";
import { toNumber, convertOrderDecimals, convertOrdersDecimals } from '../../utils/decimal.utils';

export interface CreateOrderInput {
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress?: string;
  notes?: string;
}

export interface UpdateOrderStatusInput {
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  trackingNumber?: string;
  reason?: string;
}

export class OrdersService {
  static async createOrder(userId: number, input: CreateOrderInput) {
    const { items, totalAmount, shippingAddress, notes } = input;
    
    return await prisma.$transaction(async (tx) => {
      // Verify all products exist and have sufficient stock
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { farmer: true }
        });
        
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }
        
        const stockQuantity = toNumber(product.stockQuantity);
        
        if (stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${stockQuantity}`);
        }
        
        // Update stock - calculate new value manually
        const newStockQuantity = stockQuantity - item.quantity;
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: newStockQuantity }
        });
      }
      
      // Create order - ensure totalAmount is converted properly for Prisma
      const order = await tx.order.create({
        data: {
          buyerId: userId,
          totalAmount: totalAmount,
          status: OrderStatus.PENDING,
          shippingAddress,
          notes,
          orderItems: {
            create: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.price,
              farmerId: null
            }))
          }
        },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  farmer: {
                    select: {
                      id: true,
                      first_name: true,
                      last_name: true
                    }
                  }
                }
              }
            }
          },
          buyer: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true
            }
          }
        }
      });
      
      // Update farmerId in order items
      for (const item of order.orderItems) {
        if (item.product.farmer) {
          await tx.orderItem.update({
            where: { id: item.id },
            data: { farmerId: item.product.farmer.id }
          });
        }
      }
      
      // Format ETB for messages
      const formattedTotal = new Intl.NumberFormat('en-ET', { 
        style: 'currency', 
        currency: 'ETB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(toNumber(totalAmount));
      
      // Create notifications
      const farmerIds = new Set(order.orderItems.map(item => item.product.farmer?.id).filter(Boolean));
      
      for (const farmerId of farmerIds) {
        await tx.notification.create({
          data: {
            userId: farmerId!,
            title: 'New Order Received!',
            message: `You have received a new order #${order.id} totaling ${formattedTotal}`,
            type: 'success',
            orderId: order.id
          }
        });
      }
      
      await tx.notification.create({
        data: {
          userId,
          title: 'Order Created Successfully',
          message: `Your order #${order.id} has been created. Total: ${formattedTotal}`,
          type: 'success',
          orderId: order.id
        }
      });
      
      // Create initial status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          oldStatus: null,
          newStatus: OrderStatus.PENDING,
          changedBy: userId,
          reason: 'Order placed'
        }
      });
      
      // Convert Decimal to number in response
      return convertOrderDecimals(order);
    });
  }
  
  static async getUserOrders(userId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { buyerId: userId },
        include: {
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  unit: true,
                  farmer: {
                    select: {
                      id: true,
                      first_name: true,
                      last_name: true
                    }
                  }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({ where: { buyerId: userId } })
    ]);
    
    return {
      orders: convertOrdersDecimals(orders),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  static async getFarmerOrders(farmerId: number, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: {
          orderItems: {
            some: {
              farmerId: farmerId
            }
          }
        },
        include: {
          buyer: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              phone: true
            }
          },
          orderItems: {
            where: {
              farmerId: farmerId
            },
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  unit: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.order.count({
        where: {
          orderItems: {
            some: {
              farmerId: farmerId
            }
          }
        }
      })
    ]);
    
    return {
      orders: convertOrdersDecimals(orders),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  static async getOrderById(orderId: number, userId: number, userRole: string) {
    const where: any = { id: orderId };
    
    if (userRole !== 'ADMIN') {
      where.buyerId = userId;
    }
    
    const order = await prisma.order.findUnique({
      where,
      include: {
        buyer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                unit: true,
                farmer: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    phone: true
                  }
                }
              }
            }
          }
        }
      }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    return convertOrderDecimals(order);
  }
  
  static async updateOrderStatus(
    orderId: number,
    userId: number,
    userRole: string,
    input: UpdateOrderStatusInput
  ) {
    const { status, trackingNumber, reason } = input;
    
    return await prisma.$transaction(async (tx) => {
      // Get the order
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      // Check authorization
      const isFarmer = order.orderItems.some(item => item.product.farmerId === userId);
      if (userRole !== 'ADMIN' && !isFarmer) {
        throw new Error('Unauthorized to update this order');
      }
      
      const oldStatus = order.status;
      
      // Update order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: status as OrderStatus,
          trackingNumber,
          updatedAt: new Date(),
          ...(status === 'CANCELLED' ? { cancelledAt: new Date() } : {})
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          buyer: true
        }
      });
      
      // Create status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          oldStatus,
          newStatus: status as OrderStatus,
          changedBy: userId,
          reason: reason || `Status changed from ${oldStatus} to ${status}`
        }
      });
      
      // Format ETB for message
      const formattedTotal = new Intl.NumberFormat('en-ET', { 
        style: 'currency', 
        currency: 'ETB' 
      }).format(toNumber(order.totalAmount));
      
      // Notify buyer about status change
      await tx.notification.create({
        data: {
          userId: order.buyerId,
          title: `Order #${orderId} Status Updated`,
          message: `Your order status has been updated from ${oldStatus} to ${status}. Order total: ${formattedTotal}`,
          type: status === 'DELIVERED' ? 'success' : 'info',
          orderId
        }
      });
      
      // If cancelled, restore stock
      if (status === 'CANCELLED' && oldStatus !== 'CANCELLED') {
        for (const item of order.orderItems) {
          // Get current stock
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stockQuantity: true }
          });
          
          if (product) {
            const currentStock = toNumber(product.stockQuantity);
            const quantityToRestore = toNumber(item.quantity);
            const newStock = currentStock + quantityToRestore;
            
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: newStock }
            });
          }
        }
      }
      
      return convertOrderDecimals(updatedOrder);
    });
  }
  
  static async cancelOrder(orderId: number, userId: number, userRole: string) {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { 
          orderItems: {
            include: {
              product: true
            }
          }
        }
      });
      
      if (!order) {
        throw new Error('Order not found');
      }
      
      // Check authorization
      if (userRole !== 'ADMIN' && order.buyerId !== userId) {
        throw new Error('Unauthorized to cancel this order');
      }
      
      // Only allow cancellation if status is PENDING
      if (order.status !== 'PENDING') {
        throw new Error('Only pending orders can be cancelled');
      }
      
      // Restore stock quantities
      for (const item of order.orderItems) {
        const currentStock = toNumber(item.product.stockQuantity);
        const quantityToRestore = toNumber(item.quantity);
        const newStock = currentStock + quantityToRestore;
        
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: newStock }
        });
      }
      
      // Update order status
      const cancelledOrder = await tx.order.update({
        where: { id: orderId },
        data: { 
          status: OrderStatus.CANCELLED,
          cancelledAt: new Date()
        }
      });
      
      // Create status history entry
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          oldStatus: order.status,
          newStatus: OrderStatus.CANCELLED,
          changedBy: userId,
          reason: 'Order cancelled by user'
        }
      });
      
      // Format ETB for message
      const formattedTotal = new Intl.NumberFormat('en-ET', { 
        style: 'currency', 
        currency: 'ETB' 
      }).format(toNumber(order.totalAmount));
      
      // Notify user
      await tx.notification.create({
        data: {
          userId,
          title: `Order #${orderId} Cancelled`,
          message: `Your order of ${formattedTotal} has been cancelled successfully.`,
          type: 'warning',
          orderId
        }
      });
      
      return convertOrderDecimals(cancelledOrder);
    });
  }
  
  static async getOrderStats(userId: number) {
    const stats = await prisma.order.aggregate({
      where: { buyerId: userId },
      _count: true,
      _sum: {
        totalAmount: true
      },
      _avg: {
        totalAmount: true
      }
    });
    
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      where: { buyerId: userId },
      _count: {
        status: true
      }
    });
    
    const totalSpent = stats._sum.totalAmount ? toNumber(stats._sum.totalAmount) : 0;
    const averageOrderValue = stats._avg.totalAmount ? toNumber(stats._avg.totalAmount) : 0;
    
    return {
      totalOrders: stats._count,
      totalSpent,
      averageOrderValue,
      totalSpentFormatted: new Intl.NumberFormat('en-ET', { 
        style: 'currency', 
        currency: 'ETB' 
      }).format(totalSpent),
      averageOrderValueFormatted: new Intl.NumberFormat('en-ET', { 
        style: 'currency', 
        currency: 'ETB' 
      }).format(averageOrderValue),
      statusBreakdown: statusCounts.map(item => ({
        status: item.status,
        count: item._count.status
      }))
    };
  }
  
  static async getOrderStatusHistory(orderId: number, userId: number, userRole: string) {
    // Verify access
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { buyerId: true }
    });
    
    if (!order) {
      throw new Error('Order not found');
    }
    
    if (userRole !== 'ADMIN' && order.buyerId !== userId) {
      // Check if user is a farmer who has products in this order
      const farmerOrder = await prisma.orderItem.findFirst({
        where: {
          orderId,
          farmerId: userId
        }
      });
      
      if (!farmerOrder) {
        throw new Error('Unauthorized to view this order history');
      }
    }
    
    // Get order status history
    const history = await prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' }
    });
    
    // Get user details for each history entry
    const userIds = [...new Set(history.map(h => h.changedBy))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        role: true
      }
    });
    
    const userMap = new Map(users.map(u => [u.id, u]));
    
    // Return history with user details (no Decimal fields to convert)
    return history.map(entry => ({
      ...entry,
      changedByUser: userMap.get(entry.changedBy) || null
    }));
  }
}