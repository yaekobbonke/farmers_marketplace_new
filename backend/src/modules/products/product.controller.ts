import { Request, Response } from "express";
import { ProductService } from "./product.service";
import { createProductSchema, updateProductSchema } from "./product.schema";
import { ZodError } from "zod";

export class ProductController {
  /**
   * POST /api/v1/products
   * Creates a product and assigns it to the authenticated farmer.
   */
  static async create(req: Request, res: Response) {
    try {
      console.log("🛠️ BODY RECEIVED:", req.body);
      
      // 1. Validate the incoming data
      const data = createProductSchema.parse(req.body);

      // 2. Identify the Farmer
      // Fix: Use 'userId' because that is how it was signed in the JWT payload
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
      // 4. Handle Zod Validation Errors (like missing fields)
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
        message: "Internal Server Error"
      });
    }
  }

  /**
   * GET /api/v1/products
   */
  static async getAll(req: Request, res: Response) {
    try {
      const products = await ProductService.getAll(req.query);
      res.json({
        success: true,
        count: products.length,
        data: products
      });
    } catch (error) {
      res.status(500).json({ success: false, message: "Failed to fetch products" });
    }
  }

  /**
   * GET /api/products/:id
   */
  static async getById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const numericId = Number(id);

    // Check if conversion failed
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

    res.json({ success: true, data: product });
  } catch (error) {
    // CRITICAL: Log the error in your terminal to see what actually happened!
    console.error("Backend Error in getById:", error);
    
    res.status(500).json({ 
      success: false, 
      message: "Internal Server Error",
      error: process.env.NODE_ENV === 'development' ? error : undefined 
    });
  }
}

  /**
   * PATCH /api/v1/products/:id
   */
  static async update(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const farmerId = req.user?.userId || req.user?.id;
      
      const data = updateProductSchema.parse(req.body);

      const product = await ProductService.update(id, Number(farmerId), data);
      res.json({
        success: true,
        message: "Product updated successfully",
        data: product
      });
    } catch (error: any) {
      const status = error instanceof ZodError ? 400 : 403;
      res.status(status).json({
        success: false,
        message: error.message || "Update failed"
      });
    }
  }

  /**
   
   */
  static async remove(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const farmerId = req.user?.userId || req.user?.id;

      await ProductService.remove(id, Number(farmerId));
      res.status(204).send();
    } catch (error: any) {
      res.status(403).json({
        success: false,
        message: error.message || "Delete failed"
      });
    }
  }
}
