"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_controller_1 = require("./search.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public routes
router.get("/", search_controller_1.SearchController.search);
router.get("/recommendations", search_controller_1.SearchController.getRecommendations);
router.get("/trending", search_controller_1.SearchController.getTrendingSearches); // ✅ Add this
router.get("/similar/:productId", search_controller_1.SearchController.getSimilarProducts);
// Protected routes (require authentication)
router.use(authMiddleware_1.authenticate);
router.get("/history", search_controller_1.SearchController.getSearchHistory);
router.post("/save", search_controller_1.SearchController.saveSearch);
exports.default = router;
