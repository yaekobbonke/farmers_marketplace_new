import { Request, Response } from "express";
import { RecommendationService } from "./recommendation.service";

export class RecommendationController {

  static async recommend(req: Request, res: Response) {
    const product = req.params.product;

    const data = await RecommendationService.generate(product);

    res.json({
      success: true,
      data
    });
  }

}
