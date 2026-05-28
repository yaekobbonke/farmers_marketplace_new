import { PriceProvider } from "./price.provider";
import { aiClient } from "../../lib/ai-client";

// ======================================================
// TYPES (FINAL CONTRACT)
// ======================================================

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
  id: string | number;
  productName: string;
  price: number;
  location: string;
  source: string;
  unit: string;
  recordedAt: string;
}

export class PriceService {

  // ======================================================
  // AI PREDICTION (CLEANED)
  // ======================================================

  static async getAIPrediction(
    productId: number
  ): Promise<AIPredictionResult> {

    if (!productId || isNaN(productId)) {
      throw new Error("Invalid product ID");
    }

    const signals =
      await PriceProvider.getPriceSignals(productId);

    if (!signals?.product_name) {
      throw new Error("Invalid product signals");
    }

    try {

      const response = await aiClient.post(
        "/forecast/predict",
        {
          admin1: "ADDIS ABABA",
          market_id: 1,
          commodity_id: productId,
          category: "CEREALS",
          commodity: signals.product_name,
          latitude: 9.02,
          longitude: 38.75,
          rfq: signals.scraped_price || signals.farmer_price,
          r3q: signals.historical_avg,
        }
      );

      const prediction =
        response.data.prediction?.predicted_price_etb ??
        response.data.predicted_price;

      const current = Number(signals.farmer_price);

      if (prediction && !isNaN(prediction)) {
        await PriceProvider.savePrediction(
          productId,
          Number(prediction)
        );
      }

      return {
        product: signals.product_name,
        current,
        market_average: Number(signals.scraped_price),
        predicted: prediction ? Number(prediction) : null,
        trend:
          prediction
            ? Number(prediction) > current
              ? "Increasing"
              : "Decreasing"
            : "Stable",
        confidence:
          response.data.metadata?.data_freshness ??
          "standard",
      };

    } catch (error) {

      console.error("AI Engine error:", error);

      return {
        product: signals.product_name,
        current: Number(signals.farmer_price),
        market_average: Number(signals.scraped_price),
        predicted: null,
        trend: "Stable",
        confidence: "low",
        error: "AI engine offline",
      };
    }
  }

  // ======================================================
  // MARKET SNAPSHOTS (FINAL FIX)
  // ======================================================

  static async getRecentMarketSnapshots(
    limit: number = 10
  ): Promise<MarketSnapshot[]> {

    const rawData =
      await PriceProvider.getRecentMarketSnapshots(limit);

    return rawData.map((item: any) => {

      return {
        id: item.id,

        // 🔥 STRICT FIELD (NO FALLBACK CHAOS)
        productName: item.productName,

        price: Number(item.price),

        location: item.location,

        source: item.source,

        unit: item.unit,

        recordedAt: new Date(item.recordedAt).toISOString(),
      };
    });
  }

  // ======================================================
  // SCRAPED DATA PROCESSING
  // ======================================================

  static async processScrapedData(payload: {
    name: string;
    price: number;
    market?: string;
    unit?: string;
  }) {

    if (
      !payload.name ||
      !payload.price ||
      isNaN(Number(payload.price))
    ) {
      return null;
    }

    const product =
      await PriceProvider.findProductByName(payload.name);

    if (!product) return null;

    const result =
      await PriceProvider.addMarketPrice({
        productId: product.id,
        price: Number(payload.price),
        market: payload.market || "Central Market",
        source: "ECX Scraper",
        unit: payload.unit || "kg",
      });

    return {
      id: result.id,
      productId: result.productId,
      price: Number(result.price),
      market: result.market,
      source: result.source,
      unit: result.unit,
      recordedAt: result.recordedAt,
    };
  }
}