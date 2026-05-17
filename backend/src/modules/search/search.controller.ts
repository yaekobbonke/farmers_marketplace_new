import { Request, Response } from "express";
import { SearchService } from "./search.service";

// Extend Request to include user property
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: "FARMER" | "BUYER" | "ADMIN";
    is_suspended?: boolean;
  };
}

export class SearchController {
  /**
   * Search products with query string
   * GET /api/search?q=keyword&limit=20
   */
  static async search(req: Request, res: Response) {
    try {
      const { q, limit } = req.query;
      
      // Validate and sanitize input
      if (!q || typeof q !== 'string' || q.trim().length === 0) {
        return res.status(200).json({
          success: true,
          data: [],
          meta: {
            query: q || '',
            count: 0,
            message: "No search query provided"
          }
        });
      }

      // Limit search query length
      const sanitizedQuery = q.trim().slice(0, 100);
      const searchLimit = limit ? Math.min(parseInt(limit as string) || 20, 50) : 20;

      const results = await SearchService.search(sanitizedQuery, searchLimit);
      
      // Save search to history if user is authenticated
      const authReq = req as AuthRequest;
      if (authReq.user?.id && sanitizedQuery.length >= 3) {
        // Don't await - fire and forget to not block response
        SearchService.saveSearch(authReq.user.id, sanitizedQuery).catch(err => {
          console.error("Failed to save search history:", err.message);
        });
      }
      
      res.json({
        success: true,
        data: results,
        meta: {
          query: sanitizedQuery,
          count: results.length,
          limit: searchLimit
        }
      });
    } catch (error: any) {
      console.error("❌ Search error:", error.message);
      res.status(500).json({
        success: false,
        message: "Search failed. Please try again.",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get personalized product recommendations
   * GET /api/search/recommendations?limit=6
   */
  static async getRecommendations(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string) || 6, 20) : 6;
      
      const recommendations = await SearchService.getRecommendations(userId, limit);
      
      res.json({
        success: true,
        data: recommendations,
        meta: {
          count: recommendations.length,
          limit,
          personalized: !!userId
        }
      });
    } catch (error: any) {
      console.error("❌ Recommendations error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to get recommendations",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get user's search history (authenticated only)
   * GET /api/search/history?limit=20
   */
  static async getSearchHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to view search history"
        });
      }

      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string) || 20, 50) : 20;
      const history = await SearchService.getSearchHistory(userId, limit);
      
      res.json({
        success: true,
        data: history,
        meta: {
          count: history.length,
          limit
        }
      });
    } catch (error: any) {
      console.error("❌ Search history error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to get search history",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Save a search query to history (authenticated only)
   * POST /api/search/history
   * Body: { query: "search term" }
   */
  static async saveSearch(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      const { query } = req.body;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to save search history"
        });
      }

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          message: "Valid query string is required"
        });
      }

      // Limit query length
      const sanitizedQuery = query.trim().slice(0, 100);
      
      if (sanitizedQuery.length < 2) {
        return res.status(400).json({
          success: false,
          message: "Search query must be at least 2 characters"
        });
      }

      const saved = await SearchService.saveSearch(userId, sanitizedQuery);
      
      res.json({
        success: true,
        data: saved,
        message: "Search saved to history"
      });
    } catch (error: any) {
      console.error("❌ Save search error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to save search",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Clear user's search history (authenticated only)
   * DELETE /api/search/history
   */
  static async clearSearchHistory(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required to clear search history"
        });
      }

      const result = await SearchService.clearSearchHistory(userId);
      
      res.json({
        success: true,
        data: { deletedCount: result.count },
        message: "Search history cleared successfully"
      });
    } catch (error: any) {
      console.error("❌ Clear search history error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to clear search history",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get trending searches globally
   * GET /api/search/trending?limit=5&hours=24
   */
  static async getTrendingSearches(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string) || 5, 20) : 5;
      const hours = req.query.hours ? Math.min(parseInt(req.query.hours as string) || 24, 168) : 24; // Max 7 days
      
      const trending = await SearchService.getTrendingSearches(limit, hours);
      
      res.json({
        success: true,
        data: trending,
        meta: {
          limit,
          hours,
          period: `${hours} hours`
        }
      });
    } catch (error: any) {
      console.error("❌ Trending searches error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to get trending searches",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get similar products based on product ID
   * GET /api/search/similar/:productId?limit=4
   */
  static async getSimilarProducts(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.productId);
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string) || 4, 12) : 4;
      
      if (isNaN(productId) || productId <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid product ID is required"
        });
      }
      
      const similar = await SearchService.getSimilarProducts(productId, limit);
      
      res.json({
        success: true,
        data: similar,
        meta: {
          productId,
          count: similar.length,
          limit
        }
      });
    } catch (error: any) {
      console.error("❌ Similar products error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to get similar products",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Advanced search with filters
   * GET /api/search/advanced?query=apple&categoryId=1&minPrice=10&maxPrice=100&sortBy=popular&limit=20&offset=0
   */
  static async advancedSearch(req: Request, res: Response) {
    try {
      const {
        q: query,
        categoryId,
        minPrice,
        maxPrice,
        location,
        sortBy,
        limit,
        offset
      } = req.query;

      // Build filters object
      const filters: any = {
        limit: limit ? Math.min(parseInt(limit as string) || 20, 100) : 20,
        offset: offset ? Math.max(parseInt(offset as string) || 0, 0) : 0,
        sortBy: (sortBy as any) || 'newest'
      };

      // Add optional filters
      if (query && typeof query === 'string' && query.trim()) {
        filters.query = query.trim().slice(0, 100);
      }
      
      if (categoryId && !isNaN(parseInt(categoryId as string))) {
        filters.categoryId = parseInt(categoryId as string);
      }
      
      if (minPrice && !isNaN(parseFloat(minPrice as string))) {
        filters.minPrice = parseFloat(minPrice as string);
      }
      
      if (maxPrice && !isNaN(parseFloat(maxPrice as string))) {
        filters.maxPrice = parseFloat(maxPrice as string);
      }
      
      if (location && typeof location === 'string' && location.trim()) {
        filters.location = location.trim().slice(0, 100);
      }

      const results = await SearchService.advancedSearch(filters);
      
      res.json({
        success: true,
        data: results.data,
        meta: {
          total: results.total,
          page: results.page,
          totalPages: results.totalPages,
          limit: filters.limit,
          offset: filters.offset,
          filters: {
            query: filters.query || null,
            categoryId: filters.categoryId || null,
            minPrice: filters.minPrice || null,
            maxPrice: filters.maxPrice || null,
            location: filters.location || null,
            sortBy: filters.sortBy
          }
        }
      });
    } catch (error: any) {
      console.error("❌ Advanced search error:", error.message);
      res.status(500).json({
        success: false,
        message: "Advanced search failed",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get search suggestions for autocomplete
   * GET /api/search/suggestions?q=app&limit=5
   */
  static async getSearchSuggestions(req: Request, res: Response) {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string' || q.trim().length < 2) {
        return res.status(200).json({
          success: true,
          data: [],
          meta: {
            message: "Query too short (minimum 2 characters)"
          }
        });
      }

      const sanitizedQuery = q.trim().slice(0, 50);
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string) || 5, 10) : 5;
      
      const suggestions = await SearchService.getSearchSuggestions(sanitizedQuery, limit);
      
      res.json({
        success: true,
        data: suggestions,
        meta: {
          query: sanitizedQuery,
          count: suggestions.length,
          limit
        }
      });
    } catch (error: any) {
      console.error("❌ Search suggestions error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to get search suggestions",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Clear search cache (admin only)
   * DELETE /api/search/cache
   */
  static async clearCache(req: AuthRequest, res: Response) {
    try {
      // Admin only check
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Admin access required"
        });
      }

      await SearchService.clearCache();
      
      res.json({
        success: true,
        message: "Search cache cleared successfully"
      });
    } catch (error: any) {
      console.error("❌ Clear cache error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to clear cache",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

export default SearchController;