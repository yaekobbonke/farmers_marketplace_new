import { Router } from "express";
import { ProductController } from "./product.controller";
import { authenticate, requireRole } from "../../middleware/authMiddleware";

const router = Router();

/**
 * PUBLIC ROUTES
 */
router.get("/", ProductController.getAll);
router.get("/search", ProductController.searchProducts);
router.get("/featured", ProductController.getFeaturedProducts);
router.get("/category/:categoryId", ProductController.getProductsByCategory);
router.get("/:id", ProductController.getById);

/**
 * PROTECTED ROUTES (AUTHENTICATED USERS)
 */
router.use(authenticate);

// Farmer specific routes
router.get("/farmer/products", ProductController.getFarmerProducts);
router.get("/farmer/stats", ProductController.getFarmerStats);
router.get("/farmer/low-stock", ProductController.getLowStockProducts);

// Product stock update
router.patch("/:id/stock", ProductController.updateStock);

// Product CRUD
router.post("/", requireRole("FARMER", "ADMIN"), ProductController.create);
router.patch("/:id", requireRole("FARMER", "ADMIN"), ProductController.update);
router.delete("/:id", requireRole("FARMER", "ADMIN"), ProductController.remove);

/**
 * ADMIN ONLY ROUTES
 */
router.get("/admin/all", requireRole("ADMIN"), ProductController.getAllProductsAdmin);
router.patch("/admin/:id/verify", requireRole("ADMIN"), ProductController.verifyProduct);
router.patch("/admin/:id/feature", requireRole("ADMIN"), ProductController.featureProduct);
router.delete("/admin/:id/reject", requireRole("ADMIN"), ProductController.rejectProduct); // ✅ Add reject product route

export default router;