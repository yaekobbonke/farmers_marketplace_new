import { Router } from "express";
import { AnalyticsController } from "./analytics.controller";
import { authenticate, requireRole } from "../../middleware/authMiddleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Farmer analytics routes
router.get("/farmer/overview", AnalyticsController.getFarmerOverview);
router.get("/farmer/products", AnalyticsController.getFarmerProductAnalytics);
router.get("/farmer/sales", AnalyticsController.getFarmerSalesAnalytics);
router.get("/farmer/views", AnalyticsController.getFarmerViewsAnalytics);

// Admin analytics routes (require admin role)
router.get("/admin/overview", requireRole("ADMIN"), AnalyticsController.getAdminOverview);
router.get("/admin/products", requireRole("ADMIN"), AnalyticsController.getAdminProductAnalytics);
router.get("/admin/users", requireRole("ADMIN"), AnalyticsController.getAdminUserAnalytics);

export default router;