import { Router } from "express";
import { SearchController } from "./search.controller";
import { authenticate, requireRole } from "../../middleware/authMiddleware";

const router = Router();

/**
 * PUBLIC ROUTES (No authentication required)
 */

// Basic search
router.get("/", SearchController.search);

// Search suggestions/autocomplete
router.get("/suggestions", SearchController.getSearchSuggestions);

// Advanced search with filters
router.get("/advanced", SearchController.advancedSearch);

// Trending searches globally
router.get("/trending", SearchController.getTrendingSearches);

// Product recommendations (personalized if user is logged in)
router.get("/recommendations", SearchController.getRecommendations);

// Similar products based on product ID
router.get("/similar/:productId", SearchController.getSimilarProducts);

/**
 * PROTECTED ROUTES (Authentication required)
 */
router.use(authenticate);

// User's search history
router.get("/history", SearchController.getSearchHistory);

// Save search to history
router.post("/history", SearchController.saveSearch);

// Clear all search history
router.delete("/history", SearchController.clearSearchHistory);

/**
 * ADMIN ONLY ROUTES
 */
router.delete("/cache", requireRole("ADMIN"), SearchController.clearCache);

export default router;