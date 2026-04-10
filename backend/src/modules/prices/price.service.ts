import { PriceProvider } from './price.provider';
import { aiClient } from '../../lib/ai-client';

export class PriceService {
  /**
   * Orchestrates the 3-source AI prediction.
   * Now passes IDs to satisfy the XGBoost feature requirements.
   */
  static async getAIPrediction(productId: number) {
    const signals = await PriceProvider.getPriceSignals(productId);

    // 1. Call FastAPI with the exact fields the model now expects
    const response = await aiClient.post('/forecast/predict', {
      farmer_price: Number(signals.farmer_price),
      scraped_price: Number(signals.scraped_price),
      historical_avg: Number(signals.historical_avg),
      cm_id: productId, // Passing the actual Product ID as cm_id
      mkt_id: 1        // Defaulting to 1 (e.g., Addis Ababa Market)
    });

    const prediction = response.data.predicted_price;

    // 2. Persist prediction
    await PriceProvider.savePrediction(productId, prediction);

    return {
      current: signals.farmer_price,
      market_average: signals.scraped_price,
      predicted: prediction
    };
  }

  /**
   * Provides a clean data feed for the Llama 3 chatbot context.
   */
  static async getRecentMarketSnapshots(limit: number = 10) {
    const rawData = await PriceProvider.getRecentMarketSnapshots(limit);

    return rawData.map(item => ({
      commodity: item.product?.name || "Unknown Product",
      price: item.price,
      market: item.market,
      source: item.source,
      unit: item.unit,
      recordedAt: item.recordedAt
    }));
  }

  /**
   * Processes data pushed from the BeautifulSoup scraper.
   */
  static async processScrapedData(payload: { 
    name: string; 
    price: number; 
    market?: string; 
    unit?: string 
  }) {
    const product = await PriceProvider.findProductByName(payload.name);
    
    if (!product) {
      throw new Error(`Product mapping failed: ${payload.name} not found.`);
    }

    return await PriceProvider.addMarketPrice({
      productId: product.id,
      price: payload.price,
      market: payload.market || "External Web Market",
      source: "python-scraper",
      unit: payload.unit || "kg"
    });
  }
}