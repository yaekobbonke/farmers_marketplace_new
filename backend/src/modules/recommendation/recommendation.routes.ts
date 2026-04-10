import { Router } from "express";
import { RecommendationController } from "./recommendation.controller";

const router = Router();

router.get("/:product", RecommendationController.recommend);

export default router;
