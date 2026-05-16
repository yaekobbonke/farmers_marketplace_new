import { Request, Response } from "express";
import { SearchService } from "./search.service";

export class SearchController {
  static async search(req: Request, res: Response) {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(200).json({
          success: true,
          data: []
        });
      }

      const results = await SearchService.search(q);
      
      res.json({
        success: true,
        data: results
      });
    } catch (error: any) {
      console.error("❌ Search error:", error.message);
      res.status(500).json({
        success: false,
        message: "Search failed. Please try again."
      });
    }
  }

  static async getRecommendations(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
      
      const recommendations = await SearchService.getRecommendations(userId, limit);
      
      res.json({
        success: true,
        data: recommendations
      });
    } catch (error: any) {
      console.error("❌ Recommendations error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to get recommendations"
      });
    }
  }

  static async getSearchHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      const history = await SearchService.getSearchHistory(userId);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      console.error("❌ Search history error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to get search history"
      });
    }
  }

  static async saveSearch(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { query } = req.body;
      
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required"
        });
      }

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Query is required"
        });
      }

      const saved = await SearchService.saveSearch(userId, query);
      
      res.json({
        success: true,
        data: saved
      });
    } catch (error: any) {
      console.error("Save search error:", error.message);
      res.status(500).json({
        success: false,
        message: "Failed to save search"
      });
    }
  }
  static async getTrendingSearches(req: Request, res: Response) {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
      const trending = await SearchService.getTrendingSearches(limit);
      res.json({ success: true, data: trending });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Add this method
  static async getSimilarProducts(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.productId);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
      
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      const similar = await SearchService.getSimilarProducts(productId, limit);
      res.json({ success: true, data: similar });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}