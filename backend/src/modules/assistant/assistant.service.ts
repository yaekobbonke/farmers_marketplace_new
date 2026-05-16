import { AssistantProvider } from "./assistant.provider";
import prisma from "../../config/prisma";

export class AssistantService {
  /**
   * The Service acts as the business logic layer.
   * In this case, it calls the Provider to initiate the stream from FastAPI.
   */
  static async chat(query: string) {
    // Validate input
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query: Query must be a non-empty string');
    }
    
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      throw new Error('Query cannot be empty');
    }
    
    if (trimmedQuery.length > 5000) {
      throw new Error('Query is too long. Maximum 5000 characters allowed.');
    }

    try {
      // We return the raw stream from the provider
      const stream = await AssistantProvider.chatStream(trimmedQuery);
      return stream;
    } catch (error) {
      console.error("Error in AssistantService:", error);
      throw new Error("Could not retrieve advice from the AI Assistant.");
    }
  }

  /**
   * Get AI-powered insights for farmer dashboard
   */
  static async getFarmerInsights(userId: number) {
    try {
      // Validate user ID
      if (!userId || isNaN(userId)) {
        throw new Error("Invalid user ID");
      }

      // Get farmer's products
      const products = await prisma.product.findMany({
        where: { farmerId: userId },
        include: {
          priceHistories: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        },
        orderBy: { createdAt: 'desc' }
      });
      
      // If no products, return onboarding insights
      if (products.length === 0) {
        return {
          hasData: false,
          message: "Start your farming journey",
          recommendation: "List your first product to start selling on the marketplace.",
          actionLink: "/farmer/products/add",
          actionText: "Add Your First Product",
          topProduct: null,
          pendingCount: 0,
          lowStockCount: 0,
          insights: [
            {
              type: "info",
              message: "No products listed yet",
              action: "Add Product"
            },
            {
              type: "info", 
              message: "Complete your profile",
              action: "Update Profile"
            }
          ]
        };
      }
      
      // Convert Decimal to number for each product
      const productStats = products.map(product => {
        const currentPrice = Number(product.price);
        const quantity = Number(product.quantity);
        
        const avgPrice = product.priceHistories.length > 0
          ? product.priceHistories.reduce((sum, p) => sum + Number(p.price), 0) / product.priceHistories.length
          : currentPrice;
        
        const priceTrend = product.priceHistories.length > 1
          ? Number(product.priceHistories[0].price) - Number(product.priceHistories[product.priceHistories.length - 1].price)
          : 0;
        
        let trend: "up" | "down" | "stable" = "stable";
        if (priceTrend > 0) trend = "up";
        else if (priceTrend < 0) trend = "down";
        
        let stockStatus: "healthy" | "low" | "critical" = "healthy";
        if (quantity < 5) stockStatus = "critical";
        else if (quantity < 10) stockStatus = "low";
        
        return {
          id: product.id,
          name: product.name,
          currentPrice: currentPrice,
          avgPrice,
          priceTrend,
          trend,
          quantity: quantity,
          stockStatus,
          isVerified: product.is_verified,
          views: (product as any).views || 0,
          createdAt: product.createdAt
        };
      });
      
      // Find top performing product (most views)
      const topProduct = productStats.reduce((max, p) => p.views > max.views ? p : max, productStats[0]);
      
      // Find products needing attention
      const lowStockProducts = productStats.filter(p => p.stockStatus === "low" || p.stockStatus === "critical");
      const pendingProducts = productStats.filter(p => !p.isVerified);
      const priceDropProducts = productStats.filter(p => p.trend === "down");
      const priceRiseProducts = productStats.filter(p => p.trend === "up");
      
      // Generate primary insight based on data
      let insight = "";
      let recommendation = "";
      let actionLink = "";
      let actionText = "";
      
      if (pendingProducts.length > 0) {
        insight = `📋 ${pendingProducts.length} product(s) awaiting admin approval.`;
        recommendation = `Complete your product details with clear photos and descriptions to speed up verification.`;
        actionLink = "/farmer/products?filter=pending";
        actionText = "View Pending Products";
      } 
      else if (lowStockProducts.length > 0) {
        const lowStockProduct = lowStockProducts[0];
        insight = `⚠️ "${lowStockProduct.name}" is running low on stock (${lowStockProduct.quantity} units left).`;
        recommendation = `Restock soon to avoid missing sales opportunities. Consider adjusting price based on demand.`;
        actionLink = `/farmer/products/${lowStockProduct.id}/edit`;
        actionText = "Restock Now";
      }
      else if (priceDropProducts.length > 0 && topProduct.views > 0) {
        const droppingProduct = priceDropProducts[0];
        insight = `📉 Price for "${droppingProduct.name}" has decreased by ${Math.abs(droppingProduct.priceTrend).toFixed(2)} ETB.`;
        recommendation = `Market prices are fluctuating. Consider holding inventory or adjusting your pricing strategy.`;
        actionLink = `/marketplace/${droppingProduct.id}`;
        actionText = "View Market Trends";
      }
      else if (topProduct.views > 10) {
        insight = `🔥 "${topProduct.name}" is getting attention (${topProduct.views} views this week)!`;
        if (topProduct.trend === "up") {
          recommendation = `Consider increasing price by 5-10% based on growing demand.`;
        } else {
          recommendation = `Optimize your listing with better photos and description to convert views to sales.`;
        }
        actionLink = `/farmer/products/${topProduct.id}/edit`;
        actionText = "Optimize Listing";
      }
      else if (priceRiseProducts.length > 0) {
        const risingProduct = priceRiseProducts[0];
        insight = `📈 "${risingProduct.name}" prices are trending upward.`;
        recommendation = `Great time to list more products in this category. Market demand is increasing.`;
        actionLink = `/farmer/products/add`;
        actionText = "Add Similar Product";
      }
      else {
        insight = `🌱 Your farm is doing well with ${products.length} active products.`;
        recommendation = `Add more products and optimize your listings to reach more buyers.`;
        actionLink = "/farmer/products/add";
        actionText = "Add New Product";
      }
      
      // Generate additional insights list
      const insightsList = [];
      
      if (topProduct.views > 0) {
        insightsList.push({
          type: "view",
          message: `"${topProduct.name}" has ${topProduct.views} views`,
          action: "View Details",
          link: `/marketplace/${topProduct.id}`
        });
      }
      
      if (pendingProducts.length > 0) {
        insightsList.push({
          type: "warning",
          message: `${pendingProducts.length} product(s) pending approval`,
          action: "Review Now",
          link: "/farmer/products?filter=pending"
        });
      }
      
      if (lowStockProducts.length > 0) {
        insightsList.push({
          type: "alert",
          message: `${lowStockProducts.length} product(s) low on stock`,
          action: "Restock",
          link: `/farmer/products/${lowStockProducts[0].id}/edit`
        });
      }
      
      if (priceRiseProducts.length > 0 && priceRiseProducts.length !== products.length) {
        insightsList.push({
          type: "trend-up",
          message: `${priceRiseProducts.length} product(s) showing price increase`,
          action: "View Insights",
          link: "/marketplace"
        });
      }
      
      if (priceDropProducts.length > 0 && priceDropProducts.length !== products.length) {
        insightsList.push({
          type: "trend-down",
          message: `${priceDropProducts.length} product(s) showing price decrease`,
          action: "Monitor",
          link: "/marketplace"
        });
      }
      
      insightsList.push({
        type: "tip",
        message: "Complete your profile to get better buyer trust",
        action: "Update Profile",
        link: "/profile"
      });
      
      return {
        hasData: true,
        message: insight,
        recommendation: recommendation,
        actionLink: actionLink,
        actionText: actionText,
        topProduct: {
          id: topProduct.id,
          name: topProduct.name,
          views: topProduct.views,
          price: topProduct.currentPrice,
          trend: topProduct.trend
        },
        pendingCount: pendingProducts.length,
        lowStockCount: lowStockProducts.length,
        productCount: products.length,
        verifiedCount: productStats.filter(p => p.isVerified).length,
        insights: insightsList.slice(0, 5)
      };
      
    } catch (error) {
      console.error("Error in getFarmerInsights:", error);
      return {
        hasData: false,
        message: "Welcome to your farm dashboard!",
        recommendation: "Start adding products to get AI-powered insights and recommendations.",
        actionLink: "/farmer/products/add",
        actionText: "Add Your First Product",
        topProduct: null,
        pendingCount: 0,
        lowStockCount: 0,
        insights: [
          {
            type: "info",
            message: "Add your first product to start selling",
            action: "Get Started",
            link: "/farmer/products/add"
          }
        ]
      };
    }
  }

  // ✅ ADD THIS - Get chat history for a user
  static async getChatHistory(userId: number, limit: number = 50) {
    try {
      // If you have a ChatHistory model, use it
      // For now, return empty array with placeholder
      return {
        userId,
        history: [],
        message: "Chat history feature coming soon"
      };
      
      // When you have a ChatHistory model, uncomment:
      // const history = await prisma.chatHistory.findMany({
      //   where: { userId },
      //   orderBy: { createdAt: 'desc' },
      //   take: limit
      // });
      // return history;
    } catch (error) {
      console.error("Error fetching chat history:", error);
      return [];
    }
  }

  // ✅ ADD THIS - Save a chat message
  static async saveChatMessage(userId: number, query: string, response?: string) {
    try {
      // If you have a ChatHistory model, use it
      // For now, return placeholder
      return {
        id: Date.now(),
        userId,
        query,
        response: response || null,
        createdAt: new Date(),
        message: "Chat message saved (placeholder)"
      };
      
      // When you have a ChatHistory model, uncomment:
      // const saved = await prisma.chatHistory.create({
      //   data: {
      //     userId,
      //     query,
      //     response: response || null
      //   }
      // });
      // return saved;
    } catch (error) {
      console.error("Error saving chat message:", error);
      throw new Error("Failed to save chat message");
    }
  }

  // ✅ ADD THIS - Get price forecast for a product
  static async getPriceForecast(productId: number) {
    try {
      // Get product details
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          priceHistories: {
            orderBy: { createdAt: 'desc' },
            take: 30
          }
        }
      });
      
      if (!product) {
        throw new Error("Product not found");
      }
      
      // Calculate simple moving average
      const prices = product.priceHistories.map(p => Number(p.price));
      const currentPrice = Number(product.price);
      
      let predictedPrice = currentPrice;
      let confidence = "medium";
      let trend = "stable";
      
      if (prices.length >= 7) {
        // Calculate 7-day moving average
        const last7Days = prices.slice(0, 7);
        const avgPrice = last7Days.reduce((sum, p) => sum + p, 0) / last7Days.length;
        
        if (avgPrice > currentPrice) {
          predictedPrice = avgPrice * 1.05; // 5% increase
          trend = "up";
          confidence = "high";
        } else if (avgPrice < currentPrice) {
          predictedPrice = avgPrice * 0.95; // 5% decrease
          trend = "down";
          confidence = "medium";
        } else {
          predictedPrice = currentPrice * 1.02; // 2% increase
          trend = "slightly up";
          confidence = "low";
        }
      }
      
      return {
        productId,
        productName: product.name,
        currentPrice,
        predictedPrice: Math.round(predictedPrice * 100) / 100,
        trend,
        confidence,
        timeframe: "7 days",
        basedOn: `${prices.length} historical price points`
      };
      
    } catch (error) {
      console.error("Error in getPriceForecast:", error);
      throw new Error("Failed to generate price forecast");
    }
  }

  // ✅ ADD THIS - Get admin platform insights
  static async getAdminInsights() {
    try {
      const [totalUsers, totalProducts, totalOrders, totalRevenue] = await Promise.all([
        prisma.user.count(),
        prisma.product.count(),
        prisma.order.count(),
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { status: "COMPLETED" }
        })
      ]);
      
      const pendingProducts = await prisma.product.count({
        where: { is_verified: false }
      });
      
      const recentOrders = await prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: {
            select: { first_name: true, last_name: true }
          }
        }
      });
      
      return {
        platformStats: {
          totalUsers,
          totalProducts,
          totalOrders,
          totalRevenue: totalRevenue._sum.totalAmount || 0
        },
        pendingApprovals: {
          products: pendingProducts
        },
        recentOrders,
        insights: [
          {
            type: pendingProducts > 0 ? "warning" : "success",
            message: pendingProducts > 0 
              ? `${pendingProducts} product(s) pending verification` 
              : "All products are verified",
            action: "Review Products",
            link: "/admin/products"
          }
        ]
      };
      
    } catch (error) {
      console.error("Error in getAdminInsights:", error);
      throw new Error("Failed to fetch admin insights");
    }
  }
}