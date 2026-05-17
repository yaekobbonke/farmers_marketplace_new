import axios from "axios";

// Define interfaces for type safety
interface SearchResult {
  id: number;
  name: string;
  description: string;
  price: number;
  similarity_score?: number;
  [key: string]: any;
}

interface SearchRequest {
  query: string;
  limit?: number;
  filters?: {
    category?: string;
    min_price?: number;
    max_price?: number;
    location?: string;
  };
}

interface SearchResponse {
  results: SearchResult[];
  total?: number;
  processing_time?: number;
}

export class SearchProvider {
  private static readonly AI_SEARCH_URL = process.env.AI_SEARCH_URL || "http://ai-search:8000";
  private static readonly REQUEST_TIMEOUT = 5000; // 5 seconds timeout
  private static readonly MAX_RETRIES = 2;
  private static readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Perform semantic search using AI service
   * @param query - Search query string
   * @param limit - Maximum number of results (default: 20)
   * @param filters - Optional filters for search
   * @returns Search results or null if failed
   */
  static async semanticSearch(
    query: string, 
    limit: number = 20, 
    filters?: SearchRequest['filters']
  ): Promise<SearchResult[] | null> {
    if (!query || query.trim().length < 2) {
      console.log("⚠️ Search query too short, skipping semantic search");
      return null;
    }

    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        const requestData: SearchRequest = {
          query: query.trim(),
          limit,
          ...(filters && { filters })
        };

        const response = await axios.post<SearchResponse>(
          `${this.AI_SEARCH_URL}/search`,
          requestData,
          {
            timeout: this.REQUEST_TIMEOUT,
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            }
          }
        );

        if (response.data && response.data.results) {
          console.log(`✅ Semantic search successful (attempt ${attempt}): ${response.data.results.length} results`);
          return response.data.results;
        }
        
        console.warn(`⚠️ Semantic search returned no results (attempt ${attempt})`);
        return [];
        
      } catch (error: any) {
        lastError = error;
        
        // Log detailed error information
        if (axios.isAxiosError(error)) {
          if (error.code === 'ECONNREFUSED') {
            console.error(`❌ Semantic search failed: Connection refused to AI service (attempt ${attempt}/${this.MAX_RETRIES})`);
          } else if (error.code === 'ETIMEDOUT') {
            console.error(`❌ Semantic search failed: Request timeout (attempt ${attempt}/${this.MAX_RETRIES})`);
          } else if (error.response) {
            console.error(`❌ Semantic search failed: HTTP ${error.response.status} - ${error.response.statusText} (attempt ${attempt}/${this.MAX_RETRIES})`);
          } else {
            console.error(`❌ Semantic search failed: ${error.message} (attempt ${attempt}/${this.MAX_RETRIES})`);
          }
        } else {
          console.error(`❌ Semantic search failed: ${error.message} (attempt ${attempt}/${this.MAX_RETRIES})`);
        }
        
        // Wait before retry (except on last attempt)
        if (attempt < this.MAX_RETRIES) {
          await this.delay(this.RETRY_DELAY * attempt);
        }
      }
    }
    
    console.error("❌ Semantic search failed after all retry attempts");
    return null;
  }

  /**
   * Get personalized recommendations from AI service
   * @param userId - User ID for personalization
   * @param limit - Maximum number of recommendations (default: 6)
   * @returns Recommendations or null if failed
   */
  static async getRecommendations(userId?: number, limit: number = 6): Promise<SearchResult[] | null> {
    if (!userId) {
      console.log("⚠️ No user ID provided, skipping AI recommendations");
      return null;
    }

    try {
      const response = await axios.get<SearchResponse>(
        `${this.AI_SEARCH_URL}/recommendations/${userId}`,
        {
          timeout: this.REQUEST_TIMEOUT,
          params: { limit },
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.data && response.data.results) {
        console.log(`✅ AI recommendations successful: ${response.data.results.length} results`);
        return response.data.results;
      }
      
      console.warn("⚠️ AI recommendations returned no results");
      return [];
      
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          console.error("❌ AI recommendations failed: Connection refused to AI service");
        } else if (error.response?.status === 404) {
          console.warn("⚠️ Recommendations endpoint not found on AI service");
        } else {
          console.error(`❌ AI recommendations failed: ${error.message}`);
        }
      } else {
        console.error(`❌ AI recommendations failed: ${error.message}`);
      }
      return null;
    }
  }

  /**
   * Get product embeddings from AI service
   * @param productId - Product ID to get embedding for
   * @returns Embedding vector or null if failed
   */
  static async getProductEmbedding(productId: number): Promise<number[] | null> {
    try {
      const response = await axios.get(
        `${this.AI_SEARCH_URL}/embeddings/product/${productId}`,
        {
          timeout: this.REQUEST_TIMEOUT,
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.data && response.data.embedding) {
        return response.data.embedding;
      }
      
      return null;
      
    } catch (error: any) {
      console.error(`❌ Failed to get embedding for product ${productId}:`, error.message);
      return null;
    }
  }

  /**
   * Check if AI search service is healthy
   * @returns True if service is healthy, false otherwise
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.AI_SEARCH_URL}/health`,
        {
          timeout: 2000, // Shorter timeout for health check
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      
      const isHealthy = response.status === 200;
      if (isHealthy) {
        console.log("✅ AI Search service is healthy");
      } else {
        console.warn("⚠️ AI Search service health check failed");
      }
      return isHealthy;
      
    } catch (error: any) {
      console.warn("⚠️ AI Search service is not available:", error.message);
      return false;
    }
  }

  /**
   * Batch search for multiple queries
   * @param queries - Array of search queries
   * @returns Array of results for each query
   */
  static async batchSearch(queries: string[]): Promise<{ query: string; results: SearchResult[] }[]> {
    const results: { query: string; results: SearchResult[] }[] = [];
    
    // Process queries in parallel with a limit
    const batchSize = 5;
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchPromises = batch.map(async (query) => {
        const searchResults = await this.semanticSearch(query, 10);
        return { query, results: searchResults || [] };
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Helper method to delay execution
   * @param ms - Milliseconds to delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get similar products using AI embeddings
   * @param productId - Product ID to find similar products for
   * @param limit - Maximum number of similar products (default: 6)
   * @returns Similar products or null if failed
   */
  static async getSimilarProducts(productId: number, limit: number = 6): Promise<SearchResult[] | null> {
    try {
      const response = await axios.get<SearchResponse>(
        `${this.AI_SEARCH_URL}/similar/${productId}`,
        {
          timeout: this.REQUEST_TIMEOUT,
          params: { limit },
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (response.data && response.data.results) {
        console.log(`✅ Similar products found: ${response.data.results.length} results`);
        return response.data.results;
      }
      
      return [];
      
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
        console.warn("⚠️ AI service not available for similar products");
      } else {
        console.error(`❌ Failed to get similar products: ${error.message}`);
      }
      return null;
    }
  }
}

export default SearchProvider;