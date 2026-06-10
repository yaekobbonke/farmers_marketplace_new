import prisma from "../../config/prisma";
import { NotificationService } from "../notifications/notification.service";

// Define interfaces for type safety
interface ProductData {
  name: string;
  description: string;
  price: number;
  quantity: number;      // e.g., Package Size/Weight (e.g., 5 for 5kg)
  stockQuantity: number; // 🔥 Added: Number of available units in stock
  categoryId: number;
  unit?: string;
  location?: string;
  tags?: string;
}

interface ProductAnalytics {
  id: number;
  name: string;
  category: string;
  currentPrice: number;
  avgPrice: number;
  priceTrend: "up" | "down" | "stable";
  priceChange: string;
  views: number;
  sales: number;
  revenue: number;
  orderCount: number;
  viewToSaleRatio: string;
  stock: number;         // Map this to stockQuantity now
  stockStatus: "healthy" | "low" | "critical";
  status: string;
  priceHistory: { date: Date; price: number }[];
  createdAt: Date;
  updatedAt: Date;
}

interface FarmerStats {
  totalProducts: number;
  pendingApproval: number;
  approvedCount: number;
  revenue: number;
  lowStockCount: number;
  totalOrders: number;
  totalViews: number;
  recentOrders: any[];
}

interface DailyData {
  date: string;
  productsCreated: number;
  views: number;
  label: string;
}

// Base product with all fields
interface BaseProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  stockQuantity: number; // 🔥 Added to base type
  unit: string | null;
  location: string | null;
  tags: string | null;
  views: number;
  is_verified: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  farmerId: number;
  categoryId: number;
}

// For marketplace and public routes
interface ProductWithMinimalFarmer extends BaseProduct {
  farmer: {
    id: number;
    first_name: string;
    last_name: string;
    location: string | null;
  };
  category: {
    id: number;
    name: string;
  } | null;
}

// For farmer's own products (includes price history)
interface ProductWithPriceHistory extends BaseProduct {
  category: {
    id: number;
    name: string;
  } | null;
  priceHistories: {
    createdAt: Date;
    price: number;
  }[];
}

// For admin routes (full farmer details)
interface ProductWithFullFarmer extends BaseProduct {
  farmer: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    location: string | null;
  };
  category: {
    id: number;
    name: string;
    createdAt: Date;
    updatedAt: Date;
  } | null;
  priceHistories?: {
    createdAt: Date;
    price: number;
  }[];
}

// Union type for flexibility
type ProductWithDetails = ProductWithMinimalFarmer | ProductWithPriceHistory | ProductWithFullFarmer;

// Helper function to convert Decimal to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export class ProductService {
  
  // ✅ Get all verified products for marketplace
  static async getAll(): Promise<ProductWithMinimalFarmer[]> {
    const products = await prisma.product.findMany({
      where: { 
        status: "AVAILABLE",
        is_verified: true
      },
      include: {
        farmer: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            location: true
          }
        },
        category: true
      },
      orderBy: { createdAt: "desc" }
    });
    return products as unknown as ProductWithMinimalFarmer[];
  }

  // ✅ Get single product by ID - with view tracking
  static async getById(id: number, incrementView: boolean = false): Promise<ProductWithFullFarmer | null> {
    if (!id || isNaN(id)) {
      throw new Error("Invalid product ID");
    }
    
    if (incrementView) {
      await prisma.product.update({
        where: { id },
        data: { views: { increment: 1 } }
      }).catch((err) => {
        console.error("Failed to increment view count:", err);
      });
    }
    
    const product = await prisma.product.findUnique({
      where: { id },
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
        category: true,
        priceHistories: {
          orderBy: { createdAt: "desc" },
          take: 10
        }
      }
    });
    return product as unknown as ProductWithFullFarmer | null;
  }

  // ✅ Get farmer's own products
  static async getFarmerProducts(userId: number): Promise<ProductWithPriceHistory[]> {
    if (!userId || isNaN(userId)) {
      throw new Error("Invalid user ID");
    }
    
    const products = await prisma.product.findMany({
      where: { farmerId: userId },
      include: {
        category: true,
        priceHistories: {
          orderBy: { createdAt: "desc" },
          take: 1
        }
      },
      orderBy: { createdAt: "desc" }
    });
    return products as unknown as ProductWithPriceHistory[];
  }

  // ✅ Get farmer's dashboard stats - Fixed to track stockQuantity
  static async getFarmerStats(userId: number): Promise<FarmerStats> {
    if (!userId || isNaN(userId)) {
      throw new Error("Invalid user ID");
    }
    
    const products = await prisma.product.findMany({
      where: { farmerId: userId },
      select: {
        id: true,
        price: true,
        quantity: true,
        stockQuantity: true, // 🔥 Added
        is_verified: true,
        status: true,
        views: true
      }
    });
    
    const totalProducts = products.length;
    const pendingApproval = products.filter(p => !p.is_verified).length;
    const approvedCount = products.filter(p => p.is_verified).length;
    
    // 💡 Evaluating actual available units (stockQuantity) for low stock warning instead of package sizes
    const lowStockCount = products.filter(p => toNumber(p.stockQuantity) < 10).length;
    
    // 💡 Financial asset tracking evaluates units remaining * price
    const inventoryValue = products.reduce((sum, p) => sum + (toNumber(p.price) * toNumber(p.stockQuantity)), 0);
    const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
    
    const totalOrders = await prisma.order.count({ 
      where: { 
        orderItems: { some: { product: { farmerId: userId } } }
      } 
    });
    
    const recentOrders = await prisma.order.findMany({
      where: {
        orderItems: { some: { product: { farmerId: userId } } }
      },
      include: {
        buyer: {
          select: {
            first_name: true,
            last_name: true
          }
        },
        orderItems: {
          where: { product: { farmerId: userId } },
          include: { product: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 5
    });
    
    return {
      totalProducts,
      pendingApproval,
      approvedCount,
      revenue: inventoryValue,
      lowStockCount,
      totalOrders,
      totalViews,
      recentOrders
    };
  }

  // ✅ Create new product - with stockQuantity persistence
  static async create(userId: number, data: ProductData) {
    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        quantity: data.quantity, 
        stockQuantity: data.stockQuantity, // 🔥 Persisting available items counter
        categoryId: data.categoryId,
        unit: data.unit || "piece",
        location: data.location || null,
        tags: data.tags || null,
        farmerId: userId,
        is_verified: false,
        views: 0,
        status: "AVAILABLE"
      }
    });
    
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentNotification = await prisma.notification.findFirst({
      where: {
        userId: userId,
        title: "Product Submitted for Review",
        message: { contains: product.name },
        createdAt: { gte: oneMinuteAgo }
      }
    });
    
    if (!recentNotification) {
      await NotificationService.createNotification({
        userId: userId,
        title: "Product Submitted for Review",
        message: `Your product "${product.name}" has been submitted and is pending admin approval.`,
        type: "info"
      });
    }
    
    return product;
  }

  // ✅ Update existing product - Supports partial parameters safely
  static async update(id: number, userId: number, data: Partial<ProductData>, role?: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error("Product not found");
    
    if (product.farmerId !== userId && role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data // Partial data naturally supports stockQuantity if dropped in by the controller
    });
    
    if (role !== "ADMIN") {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentNotification = await prisma.notification.findFirst({
        where: {
          userId: userId,
          title: "Product Updated",
          message: { contains: updatedProduct.name },
          createdAt: { gte: oneMinuteAgo }
        }
      });
      
      if (!recentNotification) {
        await NotificationService.createNotification({
          userId: userId,
          title: "Product Updated",
          message: `Your product "${updatedProduct.name}" has been updated successfully.`,
          type: "info"
        });
      }
    }
    
    return updatedProduct;
  }

  // ✅ Delete product
  static async remove(id: number, userId: number, role?: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new Error("Product not found");
    
    if (product.farmerId !== userId && role !== "ADMIN") {
      throw new Error("Unauthorized");
    }

    const deletedProduct = await prisma.product.delete({ where: { id } });
    
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentNotification = await prisma.notification.findFirst({
      where: {
        userId: userId,
        title: "Product Deleted",
        message: { contains: deletedProduct.name },
        createdAt: { gte: oneMinuteAgo }
      }
    });
    
    if (!recentNotification) {
      await NotificationService.createNotification({
        userId: userId,
        title: "Product Deleted",
        message: `Your product "${deletedProduct.name}" has been deleted.`,
        type: "warning"
      });
    }
    
    return deletedProduct;
  }

  // ✅ Get all products for admin
  static async getAllProductsAdmin(): Promise<ProductWithFullFarmer[]> {
    const products = await prisma.product.findMany({
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
      orderBy: { createdAt: "desc" }
    });
    return products as unknown as ProductWithFullFarmer[];
  }

  // ✅ Admin verify a product
  static async verifyProduct(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { farmer: true }
    });
    
    if (!product) {
      throw new Error("Product not found");
    }
    
    if (product.is_verified) {
      console.log(`Product ${id} is already verified. Skipping duplicate verification.`);
      return product;
    }
    
    const verifiedProduct = await prisma.product.update({
      where: { id },
      data: { is_verified: true }
    });
    
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentNotification = await prisma.notification.findFirst({
      where: {
        userId: product.farmerId,
        title: "🎉 Product Approved!",
        message: { contains: product.name },
        createdAt: { gte: oneMinuteAgo }
      }
    });
    
    if (!recentNotification) {
      await NotificationService.createNotification({
        userId: product.farmerId,
        title: "🎉 Product Approved!",
        message: `Congratulations! Your product "${product.name}" has been approved and is now live on the marketplace.`,
        type: "success"
      });
    } else {
      console.log(`⚠️ Duplicate approval notification prevented for product ${id}`);
    }
    
    return verifiedProduct;
  }

  static async rejectProduct(id: number, reason?: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { farmer: true }
    });
    
    if (!product) {
      throw new Error("Product not found");
    }
    
    const rejectedProduct = await prisma.product.delete({ where: { id } });
    
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const recentNotification = await prisma.notification.findFirst({
      where: {
        userId: product.farmerId,
        title: "Product Not Approved",
        message: { contains: product.name },
        createdAt: { gte: oneMinuteAgo }
      }
    });
    
    if (!recentNotification) {
      await NotificationService.createNotification({
        userId: product.farmerId,
        title: "Product Not Approved",
        message: reason 
          ? `Your product "${product.name}" was not approved. Reason: ${reason}`
          : `Your product "${product.name}" was not approved. Please review and resubmit.`,
        type: "error"
      });
    }
    
    return rejectedProduct;
  }

  static async featureProduct(id: number) {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { tags: true, name: true, farmerId: true }
    });
    
    if (!product) {
      throw new Error("Product not found");
    }
    
    const currentTags = product?.tags || "";
    const hasFeatured = currentTags.includes("featured");
    const newTags = hasFeatured 
      ? currentTags.replace("featured", "").replace(/,,/g, ",").replace(/^,|,$/g, "")
      : currentTags ? `${currentTags},featured` : "featured";
    
    const featuredProduct = await prisma.product.update({
      where: { id },
      data: { tags: newTags || null }
    });
    
    if (!hasFeatured) {
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentNotification = await prisma.notification.findFirst({
        where: {
          userId: product.farmerId,
          title: "🌟 Product Featured!",
          message: { contains: product.name },
          createdAt: { gte: oneMinuteAgo }
        }
      });
      
      if (!recentNotification) {
        await NotificationService.createNotification({
          userId: product.farmerId,
          title: "🌟 Product Featured!",
          message: `Great news! Your product "${product.name}" has been featured on the marketplace homepage.`,
          type: "success"
        });
      }
    }
    
    return featuredProduct;
  }

  // ✅ Get products by category
  static async getProductsByCategory(categoryId: number): Promise<ProductWithMinimalFarmer[]> {
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        status: "AVAILABLE",
        is_verified: true
      },
      include: {
        farmer: {
          select: {
            first_name: true,
            last_name: true,
            location: true
          }
        },
        category: true
      },
      orderBy: { createdAt: "desc" }
    });
    return products as unknown as ProductWithMinimalFarmer[];
  }

  // ✅ Search products
  static async searchProducts(query: string): Promise<ProductWithMinimalFarmer[]> {
    if (!query || query.trim() === "") {
      return [];
    }
    
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ],
        status: "AVAILABLE",
        is_verified: true
      },
      include: {
        farmer: {
          select: {
            first_name: true,
            last_name: true,
            location: true
          }
        },
        category: true
      },
      orderBy: { createdAt: "desc" }
    });
    return products as unknown as ProductWithMinimalFarmer[];
  }

  // ✅ Get featured products
  static async getFeaturedProducts(limit: number = 6): Promise<ProductWithMinimalFarmer[]> {
    const products = await prisma.product.findMany({
      where: {
        status: "AVAILABLE",
        is_verified: true,
        tags: { contains: "featured" }
      },
      include: {
        farmer: {
          select: {
            first_name: true,
            last_name: true,
            location: true
          }
        },
        category: true
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });
    return products as unknown as ProductWithMinimalFarmer[];
  }

  // 🔥 Fixed to target stockQuantity instead of pack quantity
  static async updateStock(productId: number, quantitySold: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stockQuantity: true, status: true, name: true, farmerId: true }
    });
    
    if (!product) throw new Error("Product not found");
    
    const currentStock = toNumber(product.stockQuantity);
    const newStock = currentStock - quantitySold;
    const newStatus = newStock <= 0 ? "SOLD_OUT" : "AVAILABLE";
    
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        stockQuantity: newStock, // Deduct from items array
        status: newStatus
      }
    });
    
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    
    if (newStock < 10 && newStock > 0) {
      const recentNotification = await prisma.notification.findFirst({
        where: {
          userId: product.farmerId,
          title: "⚠️ Low Stock Alert",
          message: { contains: product.name },
          createdAt: { gte: oneMinuteAgo }
        }
      });
      
      if (!recentNotification) {
        await NotificationService.createNotification({
          userId: product.farmerId,
          title: "⚠️ Low Stock Alert",
          message: `Your product "${product.name}" is running low. Only ${newStock} items left!`,
          type: "warning"
        });
      }
    }
    
    if (newStock <= 0) {
      const recentNotification = await prisma.notification.findFirst({
        where: {
          userId: product.farmerId,
          title: "Out of Stock",
          message: { contains: product.name },
          createdAt: { gte: oneMinuteAgo }
        }
      });
      
      if (!recentNotification) {
        await NotificationService.createNotification({
          userId: product.farmerId,
          title: "Out of Stock",
          message: `Your product "${product.name}" is now out of stock.`,
          type: "warning"
        });
      }
    }
    
    return updatedProduct;
  }

  // ✅ Get low stock products using stockQuantity
  static async getLowStockProducts(userId: number, threshold: number = 10) {
    return prisma.product.findMany({
      where: {
        farmerId: userId,
        stockQuantity: { lt: threshold }, // 🔥 Checked field changed from quantity
        status: "AVAILABLE"
      },
      include: {
        category: true
      },
      orderBy: { stockQuantity: "asc" }
    });
  }

  // ✅ Get top viewed products
  static async getTopViewedProducts(limit: number = 10): Promise<ProductWithMinimalFarmer[]> {
    try {
      const products = await prisma.product.findMany({
        where: {
          is_verified: true,
          status: "AVAILABLE"
        },
        orderBy: {
          views: 'desc'
        },
        take: limit,
        include: {
          farmer: {
            select: {
              first_name: true,
              last_name: true,
              location: true
            }
          },
          category: true
        }
      });
      return products as unknown as ProductWithMinimalFarmer[];
    } catch (error) {
      console.log("Views column not found, falling back to createdAt order");
      const products = await prisma.product.findMany({
        where: {
          is_verified: true,
          status: "AVAILABLE"
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        include: {
          farmer: {
            select: {
              first_name: true,
              last_name: true,
              location: true
            }
          },
          category: true
        }
      });
      return products as unknown as ProductWithMinimalFarmer[];
    }
  }

  // ✅ Get product analytics for farmer - Updated for stockQuantity
  static async getProductAnalytics(userId: number, period: string = "week") {
    if (!userId || isNaN(userId)) {
      throw new Error("Invalid user ID");
    }
    
    const days = period === "week" ? 7 : period === "month" ? 30 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const products = await prisma.product.findMany({
      where: {
        farmerId: userId,
        createdAt: { gte: startDate }
      },
      include: {
        priceHistories: {
          where: { createdAt: { gte: startDate } },
          orderBy: { createdAt: 'asc' }
        },
        category: true,
        orderItems: {
          include: { order: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const productAnalytics: ProductAnalytics[] = products.map(product => {
      const priceHistory = product.priceHistories.map(p => ({
        date: p.createdAt,
        price: toNumber(p.price)
      }));
      
      if (priceHistory.length === 0) {
        priceHistory.push({
          date: product.createdAt,
          price: toNumber(product.price)
        });
      }
      
      const firstPrice = priceHistory[0]?.price || toNumber(product.price);
      const lastPrice = priceHistory[priceHistory.length - 1]?.price || toNumber(product.price);
      let priceTrend: "up" | "down" | "stable" = "stable";
      if (lastPrice > firstPrice) priceTrend = "up";
      else if (lastPrice < firstPrice) priceTrend = "down";
      
      const priceChange = firstPrice > 0 ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;
      const totalSales = product.orderItems.reduce((sum, item) => sum + Number(item.quantity), 0);
      const totalRevenue = product.orderItems.reduce((sum, item) => sum + (toNumber(item.unitPrice) * Number(item.quantity)), 0);
      const orderCount = product.orderItems.length;
      const views = product.views || 0;
      const viewToSaleRatio = views > 0 ? (orderCount / views) * 100 : 0;
      
      const currentStock = toNumber(product.stockQuantity); // 🔥 Adjusted target
      let stockStatus: "healthy" | "low" | "critical" = "healthy";
      if (currentStock < 5) stockStatus = "critical";
      else if (currentStock < 10) stockStatus = "low";
      
      return {
        id: product.id,
        name: product.name,
        category: product.category?.name || "Uncategorized",
        currentPrice: toNumber(product.price),
        avgPrice: priceHistory.reduce((sum, p) => sum + p.price, 0) / priceHistory.length,
        priceTrend,
        priceChange: priceChange.toFixed(1),
        views,
        sales: totalSales,
        revenue: totalRevenue,
        orderCount,
        viewToSaleRatio: viewToSaleRatio.toFixed(1),
        stock: currentStock,
        stockStatus,
        status: product.is_verified ? "verified" : "pending",
        priceHistory,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };
    });
    
    const totalViews = productAnalytics.reduce((sum, p) => sum + p.views, 0);
    const totalSales = productAnalytics.reduce((sum, p) => sum + p.sales, 0);
    const totalRevenue = productAnalytics.reduce((sum, p) => sum + p.revenue, 0);
    const totalProducts = productAnalytics.length;
    const verifiedProducts = productAnalytics.filter(p => p.status === "verified").length;
    const pendingProducts = productAnalytics.filter(p => p.status === "pending").length;
    
    const topByViews = [...productAnalytics].sort((a, b) => b.views - a.views).slice(0, 5);
    const topBySales = [...productAnalytics].sort((a, b) => b.sales - a.sales).slice(0, 5);
    const topByRevenue = [...productAnalytics].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    
    const dailyViews = await this.generateDailyViewData(userId, days);
    
    return {
      summary: {
        totalProducts,
        verifiedProducts,
        pendingProducts,
        totalViews,
        totalSales,
        totalRevenue,
        averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0,
        period
      },
      topPerformers: {
        byViews: topByViews,
        bySales: topBySales,
        byRevenue: topByRevenue
      },
      dailyViews,
      products: productAnalytics
    };
  }

  // ✅ Private helper method for daily view data
  private static async generateDailyViewData(userId: number, days: number): Promise<DailyData[]> {
    const dailyData: DailyData[] = [];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const productsCreated = await prisma.product.count({
        where: {
          farmerId: userId,
          createdAt: {
            gte: date,
            lt: nextDate
          }
        }
      });
      
      const productsWithViews = await prisma.product.findMany({
        where: {
          farmerId: userId,
          createdAt: {
            gte: date,
            lt: nextDate
          }
        },
        select: { 
          views: true 
        }
      });
      
      const viewsCount = productsWithViews.reduce((sum, p) => sum + (p.views || 0), 0);
      
      dailyData.push({
        date: date.toISOString().split('T')[0],
        productsCreated,
        views: viewsCount,
        label: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
      });
    }
    
    return dailyData;
  }
}

export default ProductService;