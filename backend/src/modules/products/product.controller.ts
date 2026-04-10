import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { createProductSchema, updateProductSchema } from "./product.schema";
import { ZodError } from "zod";

export class ProductController {
  /**
   * POST /api/product
   * Creates a product and assigns it to the authenticated farmer.
   */
  static async create(req: Request, res: Response) {
    try {
      console.log("🛠️ BODY RECEIVED:", req.body);
      
      // 1. Validate the incoming data
      const data = createProductSchema.parse(req.body);

      // 2. Identify the Farmer
      const farmerId = req.user?.id;

      if (!farmerId) {
        return res.status(401).json({
          success: false,
          message: "Authentication failed: No User ID found in token"
        });
      }

      // 3. Save to Database
      const product = await ProductService.create(Number(farmerId), data);

      return res.status(201).json({
        success: true,
        message: "Product listed successfully",
        data: product
      });

    } catch (error: any) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: "Validation Error",
          errors: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }

      console.error("🔥 Create Product Error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        detail: error.message // Helps identify DB issues in production
      });
    }
  }

  /**
   * GET /api/product
   * Fetches all products. Added logging to debug 500 errors.
   */
  static async getAll(req: Request, res: Response) {
    try {
      console.log("📦 Request received: Fetching all products...");
      
      const products = await ProductService.getAll(req.query);
      
      return res.json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (error: any) {
      // This will now print the EXACT error (e.g., Prisma connection) in Render Logs
      console.error("❌ GET_ALL_PRODUCTS_ERROR:", error);
      
      return res.status(500).json({ 
        success: false, 
        message: "Failed to fetch products",
        detail: error.message // This reveals the hidden error in the browser/Postman
      });
    }
  }

  /**
   * GET /api/product/:id
   */
  static async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const numericId = Number(id);

      if (isNaN(numericId)) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid ID format: ${id} is not a number` 
        });
      }

      const product = await ProductService.getById(numericId);

      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      return res.json({ success: true, data: product });
    } catch (error: any) {
      console.error("🔥 getById Error:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Internal Server Error",
        detail: error.message 
      });
    }
  }

  /**
   * PATCH /api/product/:id
   */
  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const farmerId = req.user?.id;
      
      const data = updateProductSchema.parse(req.body);

      const product = await ProductService.update(id, Number(farmerId), data);
      return res.json({
        success: true,
        message: "Product updated successfully",
        data: product
      });
    } catch (error: any) {
      console.error("🔥 Update Error:", error);
      const status = error instanceof ZodError ? 400 : 403;
      return res.status(status).json({
        success: false,
        message: error.message || "Update failed"
      });
    }
  }

  /**
   * DELETE /api/product/:id
   */
  static async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const farmerId = req.user?.id;

      await ProductService.remove(id, Number(farmerId));
      return res.status(204).send();
    } catch (error: any) {
      console.error("🔥 Delete Error:", error);
      return res.status(403).json({
        success: false,
        message: error.message || "Delete failed"
      });
    }
  }
}
