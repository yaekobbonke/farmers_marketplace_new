import { RecommendationProvider } from "./recommendation.provider";
import { PriceProvider } from "../prices/price.provider";

export class RecommendationService {

  static async generate(product: string) {

    const prices = await PriceProvider.getMarketPrices(product);
    const predicted = await PriceProvider.predictPrice(7);

    return RecommendationProvider.recommend(prices, predicted);
  }

}
