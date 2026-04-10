import { PrismaClient } from '@prisma/client';
import prisma from '../../config/prisma';

export class PriceProvider {
  /**
   * Fetches the three signals required for the AI model:
   * 1. Current Farmer Price (from Product)
   * 2. Latest Scraped Price (from MarketPrice)
   * 3. Historical Average (from PriceHistory)
   */
  static async getPriceSignals(productId: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { price: true, name: true }
    });

    const latestScraped = await prisma.marketPrice.findFirst({
      where: { productId },
      orderBy: { recordedAt: 'desc' } // Note: Using recordedAt based on your schema
    });

    const history = await prisma.priceHistory.aggregate({
      where: { productId },
      _avg: { price: true }
    });

    return {
      farmer_price: product?.price,
      scraped_price: latestScraped?.price,
      historical_avg: history._avg.price || product?.price,
    };
  }

  /**
   * Persists the AI-generated prediction into the database.
   */
  static async savePrediction(productId: number, predictedPrice: number) {
    return await prisma.pricePrediction.create({
      data: {
        productId,
        predictedPrice,
        predictedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7-day forecast
      }
    });
  }

  /**
   * Used by the Internal Sync route to find a product based on 
   * strings scraped from external market websites.
   */
  static async findProductByName(name: string) {
    return await prisma.product.findFirst({
      where: { 
        name: { 
          contains: name, 
          mode: 'insensitive' 
        } 
      }
    });
  }

  /**
   * Saves new price data pushed from the Python BeautifulSoup scraper.
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
      },
    });
  }

  /**
   * NEW: Fetches the most recent market data for Llama 3 context.
   * This bridges the SQL data to the FastAPI chat service.
   */
  static async getRecentMarketSnapshots(limit: number) {
    return await prisma.marketPrice.findMany({
      take: limit,
      orderBy: {
        recordedAt: 'desc', // Matches your schema's timestamp field
      },
      include: {
        product: {
          select: { name: true }
        }
      }
    });
  }
}