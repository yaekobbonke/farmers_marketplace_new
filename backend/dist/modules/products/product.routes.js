"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const product_controller_1 = require("./product.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
/**
 * PUBLIC ROUTES
 * Farmers and Buyers can view products and market insights.
 */
router.get("/", product_controller_1.ProductController.getAll);
router.get("/:id", product_controller_1.ProductController.getById);
/**
 * PROTECTED ROUTES (FARMER/ADMIN ONLY)
 * Operations that modify the marketplace catalog.
 */
// Create a new listing
router.post("/", auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)("FARMER", "ADMIN"), product_controller_1.ProductController.create);
// Update an existing listing (Using PATCH for partial updates)
router.patch("/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)("FARMER", "ADMIN"), product_controller_1.ProductController.update);
// Remove a listing
router.delete("/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.requireRole)("FARMER", "ADMIN"), product_controller_1.ProductController.remove);
/**
 * NOTE:
 * AI Prediction and Market Data routes are currently in price.route.ts.
 * Ensure your frontend calls:
 
 */
exports.default = router;
