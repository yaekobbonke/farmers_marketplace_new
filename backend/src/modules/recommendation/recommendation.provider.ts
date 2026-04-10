import axios from "axios";

export class RecommendationProvider {

  static async recommend(prices: number[], predicted: number) {
    const res = await axios.post("http://ai-recommend:9000/recommend", {
      prices,
      predicted
    });

    return res.data.data;
  }

}
