import { SearchProvider } from "./search.provider";
import prisma from "../../config/prisma";

// Define interfaces for type safety
export interface SearchResult {
  id: number;
  name: string;
  description: string;
  price: number;
  quantity: number;
  unit: string | null;
  images: string[] | null;
  location: string | null;
  tags: string | null;
  views: number;
  is_verified: boolean;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  farmerId: number;
  categoryId: number;
  farmer: {
    first_name: string;
    last_name: string;
    location: string | null;
  };
  category: {
    id: number;
    name: string;
  } | null;
  similarity_score?: number;
}

export interface TrendingSearch {
  query: string;
  count: number;
}

export interface SimilarProduct {
  id: number;
  name: string;
  price: number;
  images: string[] | null;
  farmer: {
    first_name: string;
    last_name: string;
    location: string | null;
  };
  category: {
    name: string;
  } | null;
}

export interface AdvancedSearchFilters {
  query?: string;
  categoryId?: number;
  minPrice?: number;
  maxPrice?: number;
  location?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'popular';
  limit?: number;
  offset?: number;
}

// Simple in-memory cache
class SearchCache {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly TTL: number = 5 * 60 * 1000; // 5 minutes default TTL

  set(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    // Auto-cleanup after 10 seconds to prevent memory leaks
    setTimeout(() => this.cleanup(key), (ttl || this.TTL) + 10000);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  private cleanup(key: string): void {
    this.cache.delete(key);
  }
}

// Helper function to convert Decimal to number
const toNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = Number(value);
  return isNaN(num) ? 0 : num;
};

// Helper to normalize search query
const normalizeQuery = (query: string): string => {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
};

// Helper to transform Prisma product to SearchResult
const transformToSearchResult = (product: any): SearchResult => {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: toNumber(product.price),
    quantity: toNumber(product.quantity),
    unit: product.unit || null,
    images: product.images || null,
    location: product.location || null,
    tags: product.tags || null,
    views: product.views || 0,
    is_verified: product.is_verified,
    status: product.status,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
    farmerId: product.farmerId,
    categoryId: product.categoryId,
    farmer: {
      first_name: product.farmer?.first_name || '',
      last_name: product.farmer?.last_name || '',
      location: product.farmer?.location || null
    },
    category: product.category ? {
      id: product.category.id,
      name: product.category.name
    } : null
  };
};

export class SearchService {
  private static cache = new SearchCache();
  private static readonly DEFAULT_LIMIT = 20;
  private static readonly MAX_LIMIT = 100;

  /**
   * Main search method with semantic search and database fallback
   */
  static async search(query: string, limit: number = this.DEFAULT_LIMIT): Promise<SearchResult[]> {
    if (!query || query.trim() === "") {
      return [];
    }

    const normalizedQuery = normalizeQuery(query);
    const cacheKey = `search:${normalizedQuery}:${limit}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      console.log(`✅ Returning cached search results for: ${normalizedQuery}`);
      return cached;
    }

    try {
      // Try semantic search first with timeout
      const semanticResults = await Promise.race([
        SearchProvider.semanticSearch(normalizedQuery, limit),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
      ]);
      
      if (semanticResults && semanticResults.length > 0) {
        const results = semanticResults as SearchResult[];
        this.cache.set(cacheKey, results);
        return results;
      }
    } catch (error) {
      console.error("Semantic search failed, falling back to database search:", error);
    }

    // Fallback to database search
    const dbResults = await this.databaseSearch(normalizedQuery, limit);
    this.cache.set(cacheKey, dbResults);
    return dbResults;
  }

  /**
   * Database search fallback with pagination
   */
  static async databaseSearch(query: string, limit: number = this.DEFAULT_LIMIT): Promise<SearchResult[]> {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { contains: query, mode: 'insensitive' } }
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
      take: Math.min(limit, this.MAX_LIMIT),
      orderBy: [
        { views: 'desc' },
        { createdAt: 'desc' }
      ]
    });
    
    return products.map(transformToSearchResult);
  }

  /**
   * Get personalized recommendations for user
   */
  static async getRecommendations(userId?: number, limit: number = 6): Promise<SearchResult[]> {
    const cacheKey = userId ? `recommendations:${userId}:${limit}` : `recommendations:anonymous:${limit}`;
    
    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Try AI recommendations first if available
      const aiRecommendations = await SearchProvider.getRecommendations(userId, limit);
      if (aiRecommendations && aiRecommendations.length > 0) {
        this.cache.set(cacheKey, aiRecommendations);
        return aiRecommendations as SearchResult[];
      }
    } catch (error) {
      console.error("AI recommendations failed, falling back to database:", error);
    }

    let products: any[] = [];

    // If user is logged in, get personalized recommendations
    if (userId) {
      // Get user's past orders
      const userOrders = await prisma.order.findMany({
        where: { 
          buyerId: userId,
          status: "COMPLETED"
        },
        include: {
          orderItems: {
            include: { 
              product: { 
                select: { categoryId: true }
              } 
            }
          }
        },
        take: 10,
        orderBy: { createdAt: 'desc' }
      });

      // Extract product categories from orders
      const orderedCategories: number[] = userOrders.flatMap(order =>
        order.orderItems.map(item => item.product?.categoryId)
      ).filter((id): id is number => id !== null && id !== undefined);

      // Get popular products in those categories
      if (orderedCategories.length > 0) {
        const uniqueCategories = [...new Set(orderedCategories)];
        products = await prisma.product.findMany({
          where: {
            status: "AVAILABLE",
            is_verified: true,
            categoryId: { in: uniqueCategories },
            NOT: {
              orderItems: {
                some: {
                  order: { buyerId: userId }
                }
              }
            }
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
          orderBy: { views: 'desc' }
        });
      }
    }

    // Fallback: Get trending products if no personalized recommendations
    if (products.length === 0) {
      products = await prisma.product.findMany({
        where: { 
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
        orderBy: { views: 'desc' }
      });
    }

    const results = products.map(transformToSearchResult);
    this.cache.set(cacheKey, results);
    return results;
  }

  /**
   * Get user's search history
   */
  static async getSearchHistory(userId: number, limit: number = 20) {
    return prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 50)
    });
  }

  /**
   * Save search query to history
   */
  static async saveSearch(userId: number, query: string) {
    if (!query || query.trim() === "") return null;
    
    const normalizedQuery = normalizeQuery(query);
    
    // Don't save duplicate searches within 5 minutes
    const recentSearch = await prisma.searchHistory.findFirst({
      where: {
        userId,
        query: normalizedQuery,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000)
        }
      }
    });
    
    if (recentSearch) {
      return recentSearch;
    }
    
    return prisma.searchHistory.create({
      data: {
        userId,
        query: normalizedQuery
      }
    });
  }

  /**
   * Get trending searches globally
   */
  static async getTrendingSearches(limit: number = 5, hours: number = 24): Promise<TrendingSearch[]> {
    const cacheKey = `trending:${limit}:${hours}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const trending = await prisma.searchHistory.groupBy({
      by: ['query'],
      where: {
        createdAt: { gte: since }
      },
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
    
    const results = trending.map(t => ({
      query: t.query,
      count: t._count.query
    }));
    
    this.cache.set(cacheKey, results, 30 * 60 * 1000); // Cache for 30 minutes
    return results;
  }

  /**
   * Get similar products based on category and tags
   */
  /**
 * Get similar products based on category and tags
 */
static async getSimilarProducts(productId: number, limit: number = 4): Promise<SimilarProduct[]> {
  const cacheKey = `similar:${productId}:${limit}`;
  const cached = this.cache.get(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  // Get the product's details
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { 
      categoryId: true, 
      name: true,
      tags: true
    }
  });
  
  if (!product) return [];
  
  // Find products in the same category or with similar tags
  const similar = await prisma.product.findMany({
    where: {
      id: { not: productId },
      status: "AVAILABLE",
      is_verified: true,
      OR: [
        { categoryId: product.categoryId },
        product.tags ? { tags: { contains: product.tags.split(',')[0] } } : {}
      ]
    },
    select: {
      id: true,
      name: true,
      price: true,
      // images: true, // Uncomment if images field exists in schema
      farmer: {
        select: {
          first_name: true,
          last_name: true,
          location: true
        }
      },
      category: {
        select: {
          name: true
        }
      }
    },
    take: limit,
    orderBy: { views: 'desc' }
  });
  
  const results: SimilarProduct[] = similar.map(product => ({
    id: product.id,
    name: product.name,
    price: toNumber(product.price),
    images: null, // Replace with product.images if field exists
    farmer: {
      first_name: product.farmer.first_name,
      last_name: product.farmer.last_name,
      location: product.farmer.location
    },
    category: product.category ? { name: product.category.name } : null
  }));
  
  this.cache.set(cacheKey, results, 15 * 60 * 1000); // Cache for 15 minutes
  return results;
}

  /**
   * Advanced search with multiple filters and pagination
   */
  static async advancedSearch(filters: AdvancedSearchFilters): Promise<{
    data: SearchResult[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const {
      query,
      categoryId,
      minPrice,
      maxPrice,
      location,
      sortBy = 'newest',
      limit = this.DEFAULT_LIMIT,
      offset = 0
    } = filters;
    
    const where: any = {
      status: "AVAILABLE",
      is_verified: true
    };
    
    // Add search query filter
    if (query && query.trim()) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { tags: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    // Add category filter
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    // Add price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }
    
    // Add location filter
    if (location && location.trim()) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    
    // Determine order by
    let orderBy: any = {};
    switch (sortBy) {
      case 'price_asc':
        orderBy = { price: 'asc' };
        break;
      case 'price_desc':
        orderBy = { price: 'desc' };
        break;
      case 'popular':
        orderBy = { views: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
        break;
    }
    
    const take = Math.min(limit, this.MAX_LIMIT);
    const skip = offset;
    
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
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
        take,
        skip,
        orderBy
      }),
      prisma.product.count({ where })
    ]);
    
    return {
      data: products.map(transformToSearchResult),
      total,
      page: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(total / take)
    };
  }

  /**
   * Clear search history for a user
   */
  static async clearSearchHistory(userId: number) {
    const result = await prisma.searchHistory.deleteMany({
      where: { userId }
    });
    
    // Clear relevant caches
    this.cache.clear(`recommendations:${userId}`);
    
    return result;
  }

  /**
   * Get search suggestions for autocomplete
   */
  static async getSearchSuggestions(partialQuery: string, limit: number = 5): Promise<string[]> {
    if (!partialQuery || partialQuery.trim().length < 2) {
      return [];
    }
    
    const normalizedQuery = normalizeQuery(partialQuery);
    const cacheKey = `suggestions:${normalizedQuery}:${limit}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const suggestions = await prisma.searchHistory.groupBy({
      by: ['query'],
      where: {
        query: {
          contains: normalizedQuery,
          mode: 'insensitive'
        }
      },
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
    
    const results = suggestions.map(s => s.query);
    this.cache.set(cacheKey, results, 10 * 60 * 1000); // Cache for 10 minutes
    
    return results;
  }

  /**
   * Clear all search caches (admin only)
   */
  static async clearCache(): Promise<void> {
    this.cache.clear();
    console.log("Search cache cleared");
  }
}

export default SearchService;