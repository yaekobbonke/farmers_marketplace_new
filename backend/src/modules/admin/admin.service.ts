import prisma from "../../config/prisma";
import { formatTimeAgo } from "../../utils/dateUtils";

export class AdminService {
  static async getStats() {
    const [totalUsers, totalProducts, totalOrders, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: "COMPLETED" }
      })
    ]);

    // Get additional stats
    const [activeProducts, pendingProducts, completedOrders, pendingOrders, monthlyRevenue] = await Promise.all([
      prisma.product.count({ where: { status: "AVAILABLE" } }),
      prisma.product.count({ where: { is_verified: false } }),
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.order.count({ where: { status: "PENDING" } }),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: {
          status: "COMPLETED",
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
          }
        }
      })
    ]);

    // Calculate growth percentages (mock - you can implement actual calculations)
    const revenueChange = 12.5; // Example: 12.5% increase
    const userGrowth = 8.3;
    const orderGrowth = 15.2;
    const productGrowth = 5.7;

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      pendingProducts,
      activeProducts,
      completedOrders,
      pendingOrders,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      revenueChange,
      userGrowth,
      orderGrowth,
      productGrowth
    };
  }

  static async getAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        is_suspended: true,
        createdAt: true,
        _count: {
          select: {
            products: true,
            orders: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async updateUserRole(userId: number, role: string) {
    // Prevent demoting the last admin
    if (role !== "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" }
      });
      
      const targetUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });
      
      if (targetUser?.role === "ADMIN" && adminCount === 1) {
        throw new Error("Cannot change role of the last admin");
      }
    }
    
    return prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
        is_suspended: true,
        isActive: true
      }
    });
  }

  static async toggleSuspendUser(userId: number, isSuspended: boolean) {
    return prisma.user.update({
      where: { id: userId },
      data: { 
        is_suspended: isSuspended,
        isActive: !isSuspended
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        is_suspended: true,
        isActive: true,
        role: true
      }
    });
  }

  static async suspendUser(userId: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { is_suspended: true, isActive: false }
    });
  }

  static async unsuspendUser(userId: number) {
    return prisma.user.update({
      where: { id: userId },
      data: { is_suspended: false, isActive: true }
    });
  }

  static async deleteUser(userId: number) {
    // Prevent deleting the last admin
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });
    
    if (targetUser?.role === "ADMIN") {
      const adminCount = await prisma.user.count({
        where: { role: "ADMIN" }
      });
      
      if (adminCount === 1) {
        throw new Error("Cannot delete the last admin user");
      }
    }
    
    return prisma.user.delete({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true
      }
    });
  }

  // ✅ Add getRecentActivity method
  static async getRecentActivity() {
    try {
      // Fetch recent users
      const recentUsers = await prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          createdAt: true
        }
      });
      
      // Fetch recent products
      const recentProducts = await prisma.product.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { 
          farmer: {
            select: {
              first_name: true,
              last_name: true
            }
          }
        }
      });
      
      // Fetch recent orders
      const recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { 
          buyer: {
            select: {
              first_name: true,
              last_name: true
            }
          }
        }
      });
      
      // Combine and format activities
      const activity = [
        ...recentUsers.map(u => ({
          id: u.id,
          type: "user" as const,
          action: "New user registered",
          user: `${u.first_name} ${u.last_name}`,
          time: formatTimeAgo(u.createdAt),
          timestamp: u.createdAt
        })),
        ...recentProducts.map(p => ({
          id: p.id,
          type: "product" as const,
          action: "New product listed",
          user: p.farmer ? `${p.farmer.first_name} ${p.farmer.last_name}` : "Unknown farmer",
          time: formatTimeAgo(p.createdAt),
          timestamp: p.createdAt,
          status: p.is_verified ? "verified" : "pending"
        })),
        ...recentOrders.map(o => ({
          id: o.id,
          type: "order" as const,
          action: `Order ${o.status.toLowerCase()}`,
          user: o.buyer ? `${o.buyer.first_name} ${o.buyer.last_name}` : "Unknown buyer",
          time: formatTimeAgo(o.createdAt),
          timestamp: o.createdAt,
          status: o.status.toLowerCase()
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
      
      return activity;
    } catch (error: any) {
      console.error("Error fetching recent activity:", error);
      throw new Error("Failed to fetch recent activity");
    }
  }


  // ✅ Add getSalesData method
  static async getSalesData(range: "week" | "month" | "year" = "month") {
    try {
      const days = range === "week" ? 7 : range === "year" ? 365 : 30;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      
      // Fetch all completed orders within the date range
      const orders = await prisma.order.findMany({
        where: {
          createdAt: { gte: startDate },
          status: "COMPLETED"
        },
        select: {
          createdAt: true,
          totalAmount: true,
          id: true
        },
        orderBy: { createdAt: 'asc' }
      });
      
      // Group orders by date
      const ordersByDate = new Map<string, { orders: number; revenue: number }>();
      
      // Initialize all dates in range
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        ordersByDate.set(dateKey, { orders: 0, revenue: 0 });
      }
      
      // Aggregate orders by date
      orders.forEach(order => {
        const dateKey = order.createdAt.toISOString().split('T')[0];
        const existing = ordersByDate.get(dateKey);
        if (existing) {
          existing.orders += 1;
          existing.revenue += Number(order.totalAmount);
          ordersByDate.set(dateKey, existing);
        }
      });
      
      // Format sales data for response
      const salesData = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        const data = ordersByDate.get(dateKey) || { orders: 0, revenue: 0 };
        
        let formattedDate: string;
        if (range === "year") {
          formattedDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        } else if (range === "week") {
          formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        } else {
          formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        
        salesData.push({
          date: formattedDate,
          dateKey: dateKey,
          orders: data.orders,
          revenue: data.revenue
        });
      }
      
      // Calculate summary statistics
      const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
      const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const peakDay = salesData.reduce((max, d) => d.revenue > max.revenue ? d : max, salesData[0]);
      
      return {
        data: salesData,
        summary: {
          totalOrders,
          totalRevenue,
          averageOrderValue,
          peakDay: {
            date: peakDay.date,
            revenue: peakDay.revenue,
            orders: peakDay.orders
          },
          period: {
            start: startDate.toISOString().split('T')[0],
            end: new Date().toISOString().split('T')[0],
            range
          }
        }
      };
    } catch (error: any) {
      console.error("Error fetching sales data:", error);
      throw new Error("Failed to fetch sales data");
    }
  }
  // Get all products with farmer details
  static async getAllProducts() {
    return prisma.product.findMany({
      include: {
        farmer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone: true,
            location: true
          }
        },
        category: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // ✅ Verify a product
  static async verifyProduct(productId: number) {
    return prisma.product.update({
      where: { id: productId },
      data: { is_verified: true },
      include: {
        farmer: {
          select: {
            first_name: true,
            last_name: true,
            email: true
          }
        }
      }
    });
  }

  // ✅ Feature a product (add to featured list)
  static async featureProduct(productId: number) {
    // You may need to add a 'is_featured' field to your Product model
    // For now, we can add a 'featured' tag
    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    
    const currentTags = product?.tags || "";
    const hasFeatured = currentTags.includes("featured");
    const newTags = hasFeatured 
      ? currentTags.replace("featured", "").replace(/,,/g, ",").replace(/^,|,$/g, "")
      : currentTags ? `${currentTags},featured` : "featured";
    
    return prisma.product.update({
      where: { id: productId },
      data: { tags: newTags || null }
    });
  }

  // ✅ Delete a product
  static async deleteProduct(productId: number) {
    return prisma.product.delete({
      where: { id: productId }
    });
  }
}
