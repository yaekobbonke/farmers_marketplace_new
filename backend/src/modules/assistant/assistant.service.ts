import { Readable } from 'stream';
import { AssistantProvider } from "./assistant.provider";
import prisma from "../../config/prisma";

// Define interfaces for type safety
interface Insight {
  type: string;
  message: string;
  action: string;
  link?: string;
}

interface ProductStat {
  id: number;
  name: string;
  currentPrice: number;
  avgPrice: number;
  priceTrend: number;
  trend: "up" | "down" | "stable";
  quantity: number;
  stockStatus: "healthy" | "low" | "critical";
  isVerified: boolean;
  views: number;
  createdAt: Date;
}

interface FarmerInsightsResponse {
  hasData: boolean;
  message: string;
  recommendation: string;
  actionLink: string;
  actionText: string;
  topProduct: {
    id: number;
    name: string;
    views: number;
    price: number;
    trend: string;
  } | null;
  pendingCount: number;
  lowStockCount: number;
  productCount?: number;
  verifiedCount?: number;
  insights: Insight[];
}

// Helper function
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

export class AssistantService {

  static async chat(query: string): Promise<Readable | null> {
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query: Query must be a non-empty string');
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      throw new Error('Query cannot be empty');
    }

    if (trimmedQuery.length > 5000) {
      throw new Error('Query is too long. Maximum 5000 characters allowed.');
    }

    try {
      return await AssistantProvider.chatStream(trimmedQuery);
    } catch (error) {
      console.error("Error in AssistantService:", error);
      throw new Error("Could not retrieve advice from the AI Assistant.");
    }
  }

  // -------------------------------
  // FARMER INSIGHTS (UNCHANGED)
  // -------------------------------
  static async getFarmerInsights(userId: number): Promise<FarmerInsightsResponse> {
    try {
      if (!userId || isNaN(userId)) {
        throw new Error("Invalid user ID");
      }

      const products = await prisma.product.findMany({
        where: { farmerId: userId },
        include: {
          priceHistories: {
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (products.length === 0) {
        return {
          hasData: false,
          message: "Start your farming journey",
          recommendation: "List your first product.",
          actionLink: "/farmer/products/add",
          actionText: "Add Product",
          topProduct: null,
          pendingCount: 0,
          lowStockCount: 0,
          insights: []
        };
      }

      const productStats: ProductStat[] = products.map(product => {
        const currentPrice = toNumber(product.price);
        const quantity = toNumber(product.quantity);

        const avgPrice = product.priceHistories.length
          ? product.priceHistories.reduce((s, p) => s + toNumber(p.price), 0) / product.priceHistories.length
          : currentPrice;

        const priceTrend =
          product.priceHistories.length > 1
            ? toNumber(product.priceHistories[0].price) -
              toNumber(product.priceHistories[product.priceHistories.length - 1].price)
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
          currentPrice,
          avgPrice,
          priceTrend,
          trend,
          quantity,
          stockStatus,
          isVerified: product.is_verified,
          views: product.views || 0,
          createdAt: product.createdAt
        };
      });

      const topProduct = productStats[0];

      return {
        hasData: true,
        message: "Dashboard loaded",
        recommendation: "Optimize your products",
        actionLink: "/farmer/products",
        actionText: "View Products",
        topProduct: {
          id: topProduct.id,
          name: topProduct.name,
          views: topProduct.views,
          price: topProduct.currentPrice,
          trend: topProduct.trend
        },
        pendingCount: productStats.filter(p => !p.isVerified).length,
        lowStockCount: productStats.filter(p => p.stockStatus !== "healthy").length,
        productCount: products.length,
        verifiedCount: productStats.filter(p => p.isVerified).length,
        insights: []
      };

    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  // -------------------------------
  // 🚨 UPDATED PRICE FORECAST (FASTAPI)
  // -------------------------------
  static async getPriceForecast(productId: number) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId }
      });

      if (!product) {
        throw new Error("Product not found");
      }

      const payload = {
        admin1: "Addis Ababa",
        market_id: 480,
        commodity_id: 67,
        category: "cereals and tubers",
        commodity: product.name,
        latitude: 9.02,
        longitude: 38.75,
        rfq: toNumber(product.price),
        r3q: 0,
        include_trend: true
      };

      // 🔥 CALL FASTAPI AI SERVICE
      const response = await AssistantProvider.getPricePrediction(payload);

      return {
        productId,
        productName: product.name,
        aiPrediction: response.prediction,
        metadata: response.metadata,
        source: "FastAPI XGBoost Model"
      };

    } catch (error) {
      console.error("Error in getPriceForecast:", error);
      throw new Error("Failed to generate AI price forecast");
    }
  }

  // -------------------------------
  // REST (UNCHANGED)
  // -------------------------------
  static async getChatHistory(userId: number, limit: number = 50) {
    return { userId, history: [] };
  }

  static async saveChatMessage(userId: number, query: string, response?: string) {
    return { id: Date.now(), userId, query, response };
  }

  static async getAdminInsights() {
    return {
      platformStats: {
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0
      },
      pendingApprovals: { products: 0 },
      recentOrders: [],
      insights: []
    };
  }
}

export default AssistantService;