import { Router } from "express";
import { SearchController } from "./search.controller";
import { authenticate } from "../../middleware/authMiddleware";

const router = Router();

// Public routes
router.get("/", SearchController.search);
router.get("/recommendations", SearchController.getRecommendations);

router.get("/trending", SearchController.getTrendingSearches); // ✅ Add this
router.get("/similar/:productId", SearchController.getSimilarProducts);

// Protected routes (require authentication)
router.use(authenticate);
router.get("/history", SearchController.getSearchHistory);
router.post("/save", SearchController.saveSearch);

export default router;