"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const search_service_1 = require("./search.service");
class SearchController {
    static async search(req, res) {
        try {
            const { q } = req.query;
            if (!q || typeof q !== 'string') {
                return res.status(200).json({
                    success: true,
                    data: []
                });
            }
            const results = await search_service_1.SearchService.search(q);
            res.json({
                success: true,
                data: results
            });
        }
        catch (error) {
            console.error("❌ Search error:", error.message);
            res.status(500).json({
                success: false,
                message: "Search failed. Please try again."
            });
        }
    }
    static async getRecommendations(req, res) {
        try {
            const userId = req.user?.id;
            const limit = req.query.limit ? parseInt(req.query.limit) : 6;
            const recommendations = await search_service_1.SearchService.getRecommendations(userId, limit);
            res.json({
                success: true,
                data: recommendations
            });
        }
        catch (error) {
            console.error("❌ Recommendations error:", error.message);
            res.status(500).json({
                success: false,
                message: "Failed to get recommendations"
            });
        }
    }
    static async getSearchHistory(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication required"
                });
            }
            const history = await search_service_1.SearchService.getSearchHistory(userId);
            res.json({
                success: true,
                data: history
            });
        }
        catch (error) {
            console.error("❌ Search history error:", error.message);
            res.status(500).json({
                success: false,
                message: "Failed to get search history"
            });
        }
    }
    static async saveSearch(req, res) {
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
            const saved = await search_service_1.SearchService.saveSearch(userId, query);
            res.json({
                success: true,
                data: saved
            });
        }
        catch (error) {
            console.error("Save search error:", error.message);
            res.status(500).json({
                success: false,
                message: "Failed to save search"
            });
        }
    }
    static async getTrendingSearches(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 5;
            const trending = await search_service_1.SearchService.getTrendingSearches(limit);
            res.json({ success: true, data: trending });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Add this method
    static async getSimilarProducts(req, res) {
        try {
            const productId = parseInt(req.params.productId);
            const limit = req.query.limit ? parseInt(req.query.limit) : 4;
            if (isNaN(productId)) {
                return res.status(400).json({ success: false, message: "Invalid product ID" });
            }
            const similar = await search_service_1.SearchService.getSimilarProducts(productId, limit);
            res.json({ success: true, data: similar });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.SearchController = SearchController;
