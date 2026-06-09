import { PrismaClient, OrderStatus } from '@prisma/client';
import prisma from "../../config/prisma";
import { toNumber, convertOrderDecimals, convertOrdersDecimals } from '../../utils/decimal.utils';
import { 
  CreateOrderInput, 
  UpdateOrderStatusInput,
  OrderFilters,
  OrderStatsResponse,
  OrderStatusHistoryResponse,
  OrderResponse,
  PaginatedOrdersResponse 
} from './orders.types';

export class OrdersService {
  static async createOrder(userId: number, input: CreateOrderInput) {
    const { items, totalAmount, shippingAddress, notes } = input;
    
    // Validate input
    if (!items || items.length === 0) {
      throw new Error('No items in order');
    }
    
    if (!totalAmount || totalAmount <= 0) {
      throw new Error('Invalid total amount');
    }
    
    console.log(`📦 Creating order for user ${userId} with ${items.length} items`);
    
    return await prisma.$transaction(async (tx) => {
      // Fetch all products first to reduce database calls
      const productIds = items.map(item => item.productId);
      const products = await tx.product.findMany({
        where: { id: { in: productIds } },
        include: { farmer: true }
      });
      
      // Create a map for quick lookup
      const productMap = new Map();
      products.forEach(product => {
        productMap.set(product.id, product);
      });
      
      // Verify all products exist and have sufficient stock
      for (const item of items) {
        const product = productMap.get(item.productId);
        
        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }
        
        const stockQuantity = toNumber(product.quantity);
        
        if (stockQuantity < item.quantity) {
          throw new Error(`Insufficient stock for ${product.name}. Available: ${stockQuantity}, Requested: ${item.quantity}`);
        }
        
        if (item.quantity <= 0) {
          throw new Error(`Invalid quantity for ${product.name}. Quantity must be greater than 0`);
        }
        
        // Update stock
        const newStockQuantity = stockQuantity - item.quantity;
        console.log(`📦 Updating stock for ${product.name}: ${stockQuantity} → ${newStockQuantity}`);
        
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: newStockQuantity }
        });
      }
      
      // Create order
      const order = await tx.order.create({
        data: {
          buyerId: userId,
          totalAmount: totalAmount,
          status: OrderStatus.PENDING,
          shippingAddress: shippingAddress || null,
          notes: notes || null,
          orderItems: {
            create: items.map(item => {
              const product = productMap.get(item.productId);
              return {
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.price,
                farmerId: product?.farmer?.id || null
              };
            })
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
      
      // Update farmerId in order items (for any items that might have missed it)
      for (const item of order.orderItems) {
        if (item.product.farmer && !item.farmerId) {
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
      
      // Create notifications for farmers
      const farmerIds = new Set(
        order.orderItems
          .map(item => item.product.farmer?.id)
          .filter((id): id is number => id !== null && id !== undefined)
      );
      
      for (const farmerId of farmerIds) {
        await tx.notification.create({
          data: {
            userId: farmerId,
            title: 'New Order Received!',
            message: `You have received a new order #${order.id} totaling ${formattedTotal}`,
            type: 'success',
            orderId: order.id
          }
        });
      }
      
      // Create notification for buyer
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
      
      console.log(`✅ Order ${order.id} created successfully`);
      
      // Convert Decimal to number in response
      return convertOrderDecimals(order) as OrderResponse;
    }).catch((error) => {
      console.error('❌ Transaction failed:', error);
      throw new Error(`Order creation failed: ${error.message}`);
    });
  }
  
  static async getUserOrders(userId: number, page: number = 1, limit: number = 10): Promise<PaginatedOrdersResponse> {
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
      orders: convertOrdersDecimals(orders) as OrderResponse[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  static async getFarmerOrders(farmerId: number, page: number = 1, limit: number = 10, statusFilter?: string): Promise<PaginatedOrdersResponse> {
    const skip = (page - 1) * limit;
    
    // Build where clause
    const where: any = {
      orderItems: {
        some: {
          farmerId: farmerId
        }
      }
    };
    
    // Add status filter if provided and not 'all'
    if (statusFilter && statusFilter !== 'all') {
      where.status = statusFilter;
    }
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
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
      prisma.order.count({ where })
    ]);
    
    return {
      orders: convertOrdersDecimals(orders) as OrderResponse[],
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
  
  static async getOrderById(orderId: number, userId: number, userRole: string): Promise<OrderResponse> {
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
    
    return convertOrderDecimals(order) as OrderResponse;
  }
  
  static async updateOrderStatus(
    orderId: number,
    userId: number,
    userRole: string,
    input: UpdateOrderStatusInput
  ): Promise<OrderResponse> {
    const { status, trackingNumber } = input;
    
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
      
      // Check authorization - Farmers can update orders that contain their products
      const isFarmer = order.orderItems.some(item => item.product.farmerId === userId);
      const isBuyer = order.buyerId === userId;
      const isAdmin = userRole === 'ADMIN';
      
      if (!isAdmin && !isFarmer && !isBuyer) {
        throw new Error('Unauthorized to update this order');
      }
      
      const oldStatus = order.status;
      const newStatus = status as OrderStatus;
      
      // Update order
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: newStatus,
          trackingNumber: trackingNumber || null,
          updatedAt: new Date(),
          ...(newStatus === OrderStatus.CANCELLED ? { cancelledAt: new Date() } : {})
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
          newStatus,
          changedBy: userId,
          reason:`Status changed from ${oldStatus} to ${status}`
        }
      });
      
      // Format ETB for message
      const formattedTotal = new Intl.NumberFormat('en-ET', { 
        style: 'currency', 
        currency: 'ETB' 
      }).format(toNumber(order.totalAmount));
      
      // Notify buyer about status change (if not cancelled by buyer themselves)
      if (order.buyerId !== userId || newStatus !== OrderStatus.CANCELLED) {
        await tx.notification.create({
          data: {
            userId: order.buyerId,
            title: `Order #${orderId} Status Updated`,
            message: `Your order status has been updated from ${oldStatus} to ${status}. Order total: ${formattedTotal}`,
            type: newStatus === OrderStatus.DELIVERED ? 'success' : 'info',
            orderId
          }
        });
      }
      
      // If cancelled, restore stock
      if (newStatus === OrderStatus.CANCELLED && oldStatus !== OrderStatus.CANCELLED) {
        for (const item of order.orderItems) {
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { quantity: true }
          });
          
          if (product) {
            const currentStock = toNumber(product.quantity);
            const quantityToRestore = toNumber(item.quantity);
            const newStock = currentStock + quantityToRestore;
            
            await tx.product.update({
              where: { id: item.productId },
              data: { quantity: newStock }
            });
          }
        }
      }
      
      return convertOrderDecimals(updatedOrder) as OrderResponse;
    });
  }
  
  static async cancelOrder(orderId: number, userId: number, userRole: string): Promise<OrderResponse> {
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
      
      // Check authorization - Allow farmers to cancel orders containing their products
      let isAuthorized = false;
      
      if (userRole === 'ADMIN') {
        isAuthorized = true;
      } else if (userRole === 'FARMER') {
        // Check if this order contains products from this farmer
        const hasFarmerProduct = order.orderItems.some(item => item.product.farmerId === userId);
        isAuthorized = hasFarmerProduct;
      } else if (userRole === 'BUYER') {
        isAuthorized = order.buyerId === userId;
      }
      
      if (!isAuthorized) {
        throw new Error('Unauthorized to cancel this order');
      }
      
      // Allow cancellation for PENDING, CONFIRMED, and PROCESSING statuses
      const cancellableStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING'];
      if (!cancellableStatuses.includes(order.status)) {
        throw new Error(`Order cannot be cancelled. Current status: ${order.status}. Only pending, confirmed, or processing orders can be cancelled.`);
      }
      
      // Restore stock quantities
      for (const item of order.orderItems) {
        const currentStock = toNumber(item.product.quantity);
        const quantityToRestore = toNumber(item.quantity);
        const newStock = currentStock + quantityToRestore;
        
        await tx.product.update({
          where: { id: item.productId },
          data: { quantity: newStock }
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
          reason: userRole === 'FARMER' ? 'Order cancelled by farmer' : 'Order cancelled by user'
        }
      });
      
      // Format ETB for message
      const formattedTotal = new Intl.NumberFormat('en-ET', { 
        style: 'currency', 
        currency: 'ETB' 
      }).format(toNumber(order.totalAmount));
      
      // Notify buyer
      await tx.notification.create({
        data: {
          userId: order.buyerId,
          title: `Order #${orderId} Cancelled`,
          message: `Your order of ${formattedTotal} has been cancelled.`,
          type: 'warning',
          orderId
        }
      });
      
      // Also notify the farmer who cancelled (if it was a farmer)
      if (userRole === 'FARMER') {
        await tx.notification.create({
          data: {
            userId,
            title: `Order #${orderId} Cancelled`,
            message: `You have cancelled order #${orderId} of ${formattedTotal}.`,
            type: 'warning',
            orderId
          }
        });
      }
      
      return convertOrderDecimals(cancelledOrder) as OrderResponse;
    });
  }
  
  static async getOrderStats(userId: number): Promise<OrderStatsResponse> {
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
  
  static async getOrderStatusHistory(orderId: number, userId: number, userRole: string): Promise<OrderStatusHistoryResponse[]> {
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
    
    // Return history with user details
    return history.map(entry => ({
      id: entry.id,
      orderId: entry.orderId,
      oldStatus: entry.oldStatus,
      newStatus: entry.newStatus,
      changedBy: entry.changedBy,
      reason: entry.reason,
      createdAt: entry.createdAt,
      changedByUser: userMap.get(entry.changedBy) || null
    }));
  }
}