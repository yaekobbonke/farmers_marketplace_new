"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_controller_1 = require("./analytics.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authMiddleware_1.authenticate);
// Farmer analytics routes
router.get("/farmer/overview", analytics_controller_1.AnalyticsController.getFarmerOverview);
router.get("/farmer/products", analytics_controller_1.AnalyticsController.getFarmerProductAnalytics);
router.get("/farmer/sales", analytics_controller_1.AnalyticsController.getFarmerSalesAnalytics);
router.get("/farmer/views", analytics_controller_1.AnalyticsController.getFarmerViewsAnalytics);
// Admin analytics routes (require admin role)
router.get("/admin/overview", (0, authMiddleware_1.requireRole)("ADMIN"), analytics_controller_1.AnalyticsController.getAdminOverview);
router.get("/admin/products", (0, authMiddleware_1.requireRole)("ADMIN"), analytics_controller_1.AnalyticsController.getAdminProductAnalytics);
router.get("/admin/users", (0, authMiddleware_1.requireRole)("ADMIN"), analytics_controller_1.AnalyticsController.getAdminUserAnalytics);
exports.default = router;
