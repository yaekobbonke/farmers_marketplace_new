import axios from "axios";

export class SearchProvider {
  static async semanticSearch(query: string) {
    try {
      const res = await axios.post("http://ai-search:8000/search", {
        query
      });
      return res.data.results;
    } catch (error) {
      console.error("❌ Semantic search failed:", error);
      // Fallback to database search
      return null;
    }
  }

  static async getRecommendations(userId?: number, limit: number = 6) {
    // This will be handled by the service with database fallback
    return null;
  }
}