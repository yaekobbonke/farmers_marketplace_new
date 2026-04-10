import { Router } from "express";
import { ProductController } from "./product.controller";
import { authenticate, requireRole } from "../auth/auth.middleware";

const router = Router();

/**
 * PUBLIC ROUTES
 * Farmers and Buyers can view products and market insights.
 */
router.get("/", ProductController.getAll);
router.get("/:id", ProductController.getById);

/**
 * PROTECTED ROUTES (FARMER/ADMIN ONLY)
 * Operations that modify the marketplace catalog.
 */

// Create a new listing
router.post(
  "/", 
  authenticate, 
  requireRole("FARMER", "ADMIN"), 
  ProductController.create
);

// Update an existing listing (Using PATCH for partial updates)
router.patch(
  "/:id", 
  authenticate, 
  requireRole("FARMER", "ADMIN"), 
  ProductController.update
);

// Remove a listing
router.delete(
  "/:id", 
  authenticate, 
  requireRole("FARMER", "ADMIN"), 
  ProductController.remove
);

/**
 * NOTE: 
 * AI Prediction and Market Data routes are currently in price.route.ts.
 * Ensure your frontend calls:
 * - GET /api/v1/prices/:id/predict for the XGBoost forecast
 * - GET /api/v1/prices/latest for the Llama 3 context
 */

export default router;