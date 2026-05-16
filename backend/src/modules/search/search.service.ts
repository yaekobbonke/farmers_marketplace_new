import { SearchProvider } from "./search.provider";
import prisma from "../../config/prisma";

export class SearchService {
  static async search(query: string) {
    if (!query || query.trim() === "") {
      return [];
    }

    try {
      // Try semantic search first
      const semanticResults = await SearchProvider.semanticSearch(query);
      if (semanticResults && semanticResults.length > 0) {
        return semanticResults;
      }
    } catch (error) {
      console.error("Semantic search failed, falling back to database search");
    }

    // Fallback to database search
    return this.databaseSearch(query);
  }

  static async databaseSearch(query: string) {
    return prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ],
        status: "AVAILABLE"
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
      take: 20,
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getRecommendations(userId?: number, limit: number = 6) {
    try {
      // If user is logged in, get personalized recommendations
      if (userId) {
        // Get user's search history
        const userSearches = await prisma.searchHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10
        });

        // Get user's past orders
        const userOrders = await prisma.order.findMany({
          where: { buyerId: userId },
          include: {
            orderItems: {
              include: { product: true }
            }
          },
          take: 5
        });

        // Extract product categories from orders
        const orderedCategories = userOrders.flatMap(order =>
          order.orderItems.map(item => item.product?.categoryId)
        ).filter(Boolean);

        // Get popular products in those categories
        if (orderedCategories.length > 0) {
          const recommendations = await prisma.product.findMany({
            where: {
              status: "AVAILABLE",
              categoryId: { in: [...new Set(orderedCategories)] }
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
            take: limit,
            orderBy: { createdAt: 'desc' }
          });

          if (recommendations.length > 0) {
            return recommendations;
          }
        }
      }

      // Fallback: Get recent popular products
      const recentProducts = await prisma.product.findMany({
        where: { status: "AVAILABLE" },
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
        take: limit,
        orderBy: { createdAt: 'desc' }
      });

      return recentProducts;
    } catch (error) {
      console.error("Error getting recommendations:", error);
      return [];
    }
  }

  static async getSearchHistory(userId: number) {
    return prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async saveSearch(userId: number, query: string) {
    if (!query || query.trim() === "") return null;
    
    return prisma.searchHistory.create({
      data: {
        userId,
        query: query.trim()
      }
    });
  }
  static async getTrendingSearches(limit: number = 5) {
    // Aggregate search history to find trending searches
    const trending = await prisma.searchHistory.groupBy({
      by: ['query'],
      _count: {
        query: true
      },
      orderBy: {
        _count: {
          query: 'desc'
        }
      },
      take: limit
    });
    
    return trending.map(t => ({
      query: t.query,
      count: t._count.query
    }));
  }

  // ✅ Add this method
  static async getSimilarProducts(productId: number, limit: number = 4) {
    // Get the product's category
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, name: true }
    });
    
    if (!product) return [];
    
    // Find products in the same category
    const similar = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: productId },
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
      take: limit,
      orderBy: { createdAt: 'desc' }
    });
    
    return similar;
  }

}