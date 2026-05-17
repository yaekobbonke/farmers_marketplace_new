import { Router } from "express";
import { ProductController } from "./product.controller";
import { authenticate, requireRole } from "../../middleware/authMiddleware";

const router = Router();

/**
 * PUBLIC ROUTES (No authentication required)
 */
router.get("/", ProductController.getAll);
router.get("/search", ProductController.searchProducts);
router.get("/featured", ProductController.getFeaturedProducts);
router.get("/top-viewed", ProductController.getTopViewedProducts);
router.get("/category/:categoryId", ProductController.getProductsByCategory);
router.get("/:id", ProductController.getById);

/**
 * PROTECTED ROUTES (Authentication required)
 */
router.use(authenticate);

// Farmer analytics routes
router.get("/farmer/analytics", requireRole("FARMER", "ADMIN"), ProductController.getProductAnalytics);
router.get("/farmer/products", requireRole("FARMER", "ADMIN"), ProductController.getFarmerProducts);
router.get("/farmer/stats", requireRole("FARMER", "ADMIN"), ProductController.getFarmerStats);
router.get("/farmer/low-stock", requireRole("FARMER", "ADMIN"), ProductController.getLowStockProducts);

// Product stock update (farmers can update their own product stock)
router.patch("/:id/stock", requireRole("FARMER", "ADMIN"), ProductController.updateStock);

// Product CRUD operations (farmers and admins)
router.post("/", requireRole("FARMER", "ADMIN"), ProductController.create);
router.patch("/:id", requireRole("FARMER", "ADMIN"), ProductController.update);
router.delete("/:id", requireRole("FARMER", "ADMIN"), ProductController.remove);

/**
 * ADMIN ONLY ROUTES (Admin access required)
 */
// Get all products for admin panel
router.get("/admin/all", requireRole("ADMIN"), ProductController.getAllProductsAdmin);

// Admin product management
router.patch("/admin/:id/verify", requireRole("ADMIN"), ProductController.verifyProduct);
router.patch("/admin/:id/feature", requireRole("ADMIN"), ProductController.featureProduct);
router.delete("/admin/:id/reject", requireRole("ADMIN"), ProductController.rejectProduct);

// Admin analytics
router.get("/admin/top-viewed", requireRole("ADMIN"), ProductController.getTopViewedProducts);

export default router;