import prisma from "../../config/prisma";
import { formatTimeAgo } from "../../utils/dateUtils";

// Helper function to safely convert any numeric value to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Define interfaces for type safety
interface SalesDataPoint {
  date: string;
  dateKey: string;
  orders: number;
  revenue: number;
}

interface SalesSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  peakDay: {
    date: string;
    revenue: number;
    orders: number;
  };
  period: {
    start: string;
    end: string;
    range: "week" | "month" | "year";
  };
}

interface SalesResponse {
  data: SalesDataPoint[];
  summary: SalesSummary;
}

interface DashboardStats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingProducts: number;
  activeProducts: number;
  completedOrders: number;
  pendingOrders: number;
  monthlyRevenue: number;
  revenueChange: number;
  userGrowth: number;
  orderGrowth: number;
  productGrowth: number;
}

interface ActivityItem {
  id: number;
  type: "user" | "product" | "order";
  action: string;
  user: string;
  time: string;
  timestamp: Date;
  status?: string;
}

export class AdminService {
  static async getStats(): Promise<DashboardStats> {
    const [totalUsers, totalProducts, totalOrders, totalRevenue] = await Promise.all([
      prisma.user.count(),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.aggregate({
        _sum: { totalAmount: true },
        where: { status: "COMPLETED" }
      })
    ]);

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

    const revenueChange = 12.5;
    const userGrowth = 8.3;
    const orderGrowth = 15.2;
    const productGrowth = 5.7;

    return {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: toNumber(totalRevenue._sum.totalAmount),
      pendingProducts,
      activeProducts,
      completedOrders,
      pendingOrders,
      monthlyRevenue: toNumber(monthlyRevenue._sum.totalAmount),
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

  static async getRecentActivity(): Promise<ActivityItem[]> {
    try {
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
      
      const activity: ActivityItem[] = [
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

  static async getSalesData(range: "week" | "month" | "year" = "month"): Promise<SalesResponse> {
    try {
      const days = range === "week" ? 7 : range === "year" ? 365 : 30;
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      
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
      
      const ordersByDate = new Map<string, { orders: number; revenue: number }>();
      
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateKey = date.toISOString().split('T')[0];
        ordersByDate.set(dateKey, { orders: 0, revenue: 0 });
      }
      
      orders.forEach(order => {
        const dateKey = order.createdAt.toISOString().split('T')[0];
        const existing = ordersByDate.get(dateKey);
        if (existing) {
          existing.orders += 1;
          existing.revenue += toNumber(order.totalAmount);
          ordersByDate.set(dateKey, existing);
        }
      });
      
      const salesData: SalesDataPoint[] = [];
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
      
      const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
      const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      if (salesData.length === 0) {
        return {
          data: [],
          summary: {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            peakDay: {
              date: '',
              revenue: 0,
              orders: 0
            },
            period: {
              start: startDate.toISOString().split('T')[0],
              end: new Date().toISOString().split('T')[0],
              range
            }
          }
        };
      }
      
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

  static async featureProduct(productId: number) {
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

  static async deleteProduct(productId: number) {
    return prisma.product.delete({
      where: { id: productId }
    });
  }
}

export default AdminService;