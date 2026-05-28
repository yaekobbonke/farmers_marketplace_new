export class PriceMapper {
  static toMarketDTO(item: any) {
    return {
      id: item.id,

      productName:
        item.product?.name ||
        item.productName ||
        item.product_name ||
        item.name ||
        "Unknown Product",

      price: Number(item.price ?? 0),

      location:
        item.market ||
        item.location ||
        item.region ||
        "Unknown",

      unit: item.unit || "kg",

      recordedAt:
        item.recordedAt
          ? item.recordedAt.toISOString?.() || item.recordedAt
          : new Date().toISOString(),

      source: item.source || "Market Data",
    };
  }
}