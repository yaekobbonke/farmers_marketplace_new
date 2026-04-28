import { PrismaClient } from '@prisma/client';
import prisma from '../../config/prisma';

export class PriceProvider {
  /**
   * Fetches the signals required for the XGBoost model.
   */
  static async getPriceSignals(productId: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { price: true, name: true }
    });

    const latestScraped = await prisma.marketPrice.findFirst({
      where: { productId },
      orderBy: { recordedAt: 'desc' }
    });

    const history = await prisma.priceHistory.aggregate({
      where: { productId },
      _avg: { price: true }
    });

    return {
      farmer_price: product?.price ? Number(product.price) : 0,
      scraped_price: latestScraped?.price ? Number(latestScraped.price) : 0,
      historical_avg: history._avg.price ? Number(history._avg.price) : (product?.price ? Number(product.price) : 0),
      product_name: product?.name || "Unknown"
    };
  }

  /**
   * Persists AI-generated prediction.
   */
  static async savePrediction(productId: number, predictedPrice: number) {
    return await prisma.pricePrediction.create({
      data: {
        productId,
        predictedPrice,
        predictedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
      }
    });
  }

  /**
   * Saves new price data pushed from your Python Scraper.
   */
  static async addMarketPrice(data: {
    productId: number;
    price: number;
    market: string;
    source: string;
    unit: string;
  }) {
    return await prisma.marketPrice.create({
      data: {
        productId: data.productId,
        price: data.price,
        market: data.market,
        source: data.source,
        unit: data.unit,
        recordedAt: new Date(),
      },
    });
  }

  /**
   * UPDATED FOR RESILIENCE: Provides data for Llama 3.
   * If MarketPrice table is empty, it falls back to the Product table 
   * so the AI doesn't report "No data found."
   */
  static async getRecentMarketSnapshots(limit: number) {
    // 1. Try to get official scraped market prices
    const marketData = await prisma.marketPrice.findMany({
      take: limit,
      orderBy: { recordedAt: 'desc' },
      include: {
        product: {
          select: { name: true }
        }
      }
    });

    if (marketData.length > 0) {
      return marketData.map(item => ({
        product: item.product.name,
        market: item.market,
        price: Number(item.price),
        unit: item.unit,
        recordedAt: item.recordedAt,
        source: item.source
      }));
    }

    // 2. FALLBACK: If no scraped data exists, show the Farmer's listed products
    // This ensures your UI and AI always have something to show.
    const products = await prisma.product.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      where: { status: 'AVAILABLE' }
    });

    return products.map(p => ({
      product: p.name,
      market: p.location || "Local Market",
      price: Number(p.price),
      unit: p.unit,
      recordedAt: p.createdAt,
      source: "Farmer Listing"
    }));
  }

  /**
   * Improved lookup to handle various string formats from scrapers.
   */
  static async findProductByName(name: string) {
    // Clean the name (e.g., "Maize (White)" -> "Maize")
    const cleanName = name.split('(')[0].trim();

    return await prisma.product.findFirst({
      where: {
        OR: [
          { name: { contains: cleanName, mode: 'insensitive' } },
          { name: { contains: name, mode: 'insensitive' } }
        ]
      }
    });
  }
}