"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("./product.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
/**
 * PUBLIC ROUTES
 */
router.get("/", product_controller_1.ProductController.getAll);
router.get("/search", product_controller_1.ProductController.searchProducts);
router.get("/featured", product_controller_1.ProductController.getFeaturedProducts);
router.get("/category/:categoryId", product_controller_1.ProductController.getProductsByCategory);
router.get("/:id", product_controller_1.ProductController.getById);
/**
 * PROTECTED ROUTES (AUTHENTICATED USERS)
 */
router.use(authMiddleware_1.authenticate);
// Farmer specific routes
router.get("/farmer/products", product_controller_1.ProductController.getFarmerProducts);
router.get("/farmer/stats", product_controller_1.ProductController.getFarmerStats);
router.get("/farmer/low-stock", product_controller_1.ProductController.getLowStockProducts);
// Product stock update
router.patch("/:id/stock", product_controller_1.ProductController.updateStock);
// Product CRUD
router.post("/", (0, authMiddleware_1.requireRole)("FARMER", "ADMIN"), product_controller_1.ProductController.create);
router.patch("/:id", (0, authMiddleware_1.requireRole)("FARMER", "ADMIN"), product_controller_1.ProductController.update);
router.delete("/:id", (0, authMiddleware_1.requireRole)("FARMER", "ADMIN"), product_controller_1.ProductController.remove);
/**
 * ADMIN ONLY ROUTES
 */
router.get("/admin/all", (0, authMiddleware_1.requireRole)("ADMIN"), product_controller_1.ProductController.getAllProductsAdmin);
router.patch("/admin/:id/verify", (0, authMiddleware_1.requireRole)("ADMIN"), product_controller_1.ProductController.verifyProduct);
router.patch("/admin/:id/feature", (0, authMiddleware_1.requireRole)("ADMIN"), product_controller_1.ProductController.featureProduct);
router.delete("/admin/:id/reject", (0, authMiddleware_1.requireRole)("ADMIN"), product_controller_1.ProductController.rejectProduct); // ✅ Add reject product route
exports.default = router;
