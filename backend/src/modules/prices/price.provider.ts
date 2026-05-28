import prisma from "../../config/prisma";

/**
 * SINGLE SOURCE OF TRUTH MAPPER
 */
class PriceMapper {
  static toMarketDTO(item: any) {
    return {
      id: item.id,

      productName:
        item.product?.name ||
        item.productName ||
        "Unknown Product",

      price: Number(item.price ?? 0),

      location:
        item.market ||
        item.location ||
        "Unknown",

      unit: item.unit || "kg",

      recordedAt: item.recordedAt
        ? new Date(item.recordedAt).toISOString()
        : new Date().toISOString(),

      source: item.source || "Market Data",
    };
  }
}

export class PriceProvider {

  /**
   * AI SIGNALS
   */
  static async getPriceSignals(productId: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        price: true,
        name: true,
      },
    });

    const latestScraped = await prisma.marketPrice.findFirst({
      where: { productId },
      orderBy: { recordedAt: "desc" },
    });

    const history = await prisma.priceHistory.aggregate({
      where: { productId },
      _avg: { price: true },
    });

    return {
      farmer_price: Number(product?.price ?? 0),
      scraped_price: Number(latestScraped?.price ?? 0),
      historical_avg: Number(
        history._avg.price ?? product?.price ?? 0
      ),
      product_name: product?.name ?? "Unknown",
    };
  }

  /**
   * SAVE PREDICTION
   */
  static async savePrediction(
    productId: number,
    predictedPrice: number
  ) {
    return prisma.pricePrediction.create({
      data: {
        productId,
        predictedPrice,
        predictedDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000
        ),
      },
    });
  }

  /**
   * INSERT MARKET PRICE (FIXED)
   */
  static async addMarketPrice(data: {
    productId: number;
    price: number;
    market: string;
    source: string;
    unit: string;
  }) {

    // 🔥 SAFETY CHECK (prevents orphan data)
    const productExists = await prisma.product.findUnique({
      where: { id: data.productId },
    });

    if (!productExists) {
      throw new Error(
        `Invalid productId: ${data.productId}`
      );
    }

    return prisma.marketPrice.create({
      data: {
        productId: data.productId,
        price: Number(data.price),
        market: data.market,
        source: data.source,
        unit: data.unit,
        recordedAt: new Date(),
      },
    });
  }

  /**
   * MAIN MARKET SNAPSHOTS (FIXED)
   */
  static async getRecentMarketSnapshots(limit: number) {

    const marketData = await prisma.marketPrice.findMany({
      take: limit,
      orderBy: { recordedAt: "desc" },
      include: {
        product: {
          select: { name: true },
        },
      },
    });

    if (marketData.length > 0) {
      return marketData.map((item) =>
        PriceMapper.toMarketDTO({
          id: item.id,
          product: item.product,
          productName: item.product?.name,
          price: item.price,
          market: item.market,
          unit: item.unit,
          recordedAt: item.recordedAt,
          source: item.source,
        })
      );
    }

    // fallback
    const products = await prisma.product.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      where: {
        status: "AVAILABLE",
        is_verified: true,
      },
      include: {
        farmer: {
          select: {
            location: true,
          },
        },
      },
    });

    return products.map((p) =>
      PriceMapper.toMarketDTO({
        id: p.id,
        productName: p.name,
        price: p.price,
        market: p.location || p.farmer?.location,
        unit: p.unit,
        recordedAt: p.createdAt,
        source: "Farmer Listing",
      })
    );
  }

  /**
   * PRODUCT LOOKUP
   */
  static async findProductByName(name: string) {
    const cleanName = name.split("(")[0].trim();

    return prisma.product.findFirst({
      where: {
        OR: [
          {
            name: {
              contains: cleanName,
              mode: "insensitive",
            },
          },
          {
            name: {
              contains: name,
              mode: "insensitive",
            },
          },
        ],
      },
    });
  }
}