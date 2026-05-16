"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchProvider = void 0;
const axios_1 = __importDefault(require("axios"));
class SearchProvider {
    static async semanticSearch(query) {
        try {
            const res = await axios_1.default.post("http://ai-search:8000/search", {
                query
            });
            return res.data.results;
        }
        catch (error) {
            console.error("❌ Semantic search failed:", error);
            // Fallback to database search
            return null;
        }
    }
    static async getRecommendations(userId, limit = 6) {
        // This will be handled by the service with database fallback
        return null;
    }
}
exports.SearchProvider = SearchProvider;
