import { PriceProvider } from './price.provider';
import { aiClient } from '../../lib/ai-client';

// Define return types
interface AIPredictionResult {
  product: string;
  current: number;
  market_average: number;
  predicted: number | null;
  trend: string;
  confidence: string;
  error?: string;
}

interface MarketSnapshot {
  commodity: string;
  price: number;
  market: string;
  source: string;
  unit: string;
  recordedAt: string;
}

interface ScrapedDataResult {
  id: string;
  productId: number;
  price: number;
  market: string;
  source: string;
  unit: string;
  recordedAt: Date;
}

export class PriceService {
  /**
   * Orchestrates the 3-source AI prediction.
   */
  static async getAIPrediction(productId: number): Promise<AIPredictionResult> {
    if (!productId || isNaN(productId)) {
      throw new Error("Invalid product ID");
    }

    const signals = await PriceProvider.getPriceSignals(productId);
    
    if (!signals || signals.product_name === "Unknown") {
      throw new Error("Could not retrieve valid product signals for prediction.");
    }

    try {
      const response = await aiClient.post('/forecast/predict', {
        admin1: "ADDIS ABABA",
        market_id: 1,
        commodity_id: productId,
        category: "CEREALS",
        commodity: signals.product_name,
        latitude: 9.02,
        longitude: 38.75,
        rfq: signals.scraped_price || signals.farmer_price,
        r3q: signals.historical_avg
      });

      const prediction = response.data.prediction?.predicted_price_etb || response.data.predicted_price;

      if (prediction && !isNaN(prediction)) {
        await PriceProvider.savePrediction(productId, prediction);
      }

      return {
        product: signals.product_name,
        current: Number(signals.farmer_price),
        market_average: Number(signals.scraped_price),
        predicted: prediction ? Number(prediction) : null,
        trend: prediction && signals.farmer_price ? 
          (Number(prediction) > Number(signals.farmer_price) ? "Increasing" : "Decreasing") : 
          "Stable",
        confidence: response.data.metadata?.data_freshness || "standard"
      };
    } catch (error) {
      console.error("❌ AI Forecast Engine unreachable:", error);
      return { 
        product: signals.product_name, 
        current: Number(signals.farmer_price), 
        market_average: Number(signals.scraped_price),
        predicted: null, 
        trend: "Stable",
        confidence: "low",
        error: "AI engine temporarily offline. Please try again later." 
      };
    }
  }

  /**
   * Provides a structured feed for the Llama 3 chatbot.
   * ✅ FIXED: Properly formats dates and handles missing product names
   */
  static async getRecentMarketSnapshots(limit: number = 10): Promise<MarketSnapshot[]> {
    try {
      const rawData = await PriceProvider.getRecentMarketSnapshots(limit);
      
      console.log("Raw data from PriceProvider:", rawData); // Debug log
      
      return rawData.map(item => {
        // ✅ Safely format the date
        let formattedDate = "Recently";
        if (item.recordedAt) {
          try {
            const date = new Date(item.recordedAt);
            if (!isNaN(date.getTime())) {
              formattedDate = date.toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });
            }
          } catch (e) {
            console.warn("Date formatting error:", e);
          }
        }
        
        // ✅ Ensure commodity name is not empty
        const commodityName = item.product && item.product !== "Unknown Product" 
          ? item.product 
          : "Agricultural Product";
        
        return {
          commodity: commodityName,
          price: Number(item.price) || 0,
          market: item.market || "Local Market",
          source: item.source || "Market Data",
          unit: item.unit || "kg",
          recordedAt: formattedDate
        };
      });
    } catch (error) {
      console.error("Error fetching market snapshots:", error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Processes data pushed from the BeautifulSoup/JSON Scraper.
   */
  static async processScrapedData(payload: { 
    name: string; 
    price: number; 
    market?: string; 
    unit?: string 
  }): Promise<ScrapedDataResult | null> {
    if (!payload.name || !payload.price || isNaN(Number(payload.price))) {
      console.error("❌ Invalid price received from scraper.");
      return null;
    }

    const product = await PriceProvider.findProductByName(payload.name);
    
    if (!product) {
      console.warn(`⚠️ No database mapping found for scraped item: "${payload.name}". Add this product to track it.`);
      return null; 
    }

    const result = await PriceProvider.addMarketPrice({
      productId: product.id,
      price: Number(payload.price),
      market: payload.market || "Central Market",
      source: "Official ECX Daily Scraper",
      unit: payload.unit || "kg"
    });

    if (result) {
      return {
        id: result.id,
        productId: result.productId,
        price: Number(result.price),
        market: result.market,
        source: result.source,
        unit: result.unit,
        recordedAt: result.recordedAt
      };
    }

    return null;
  }
}