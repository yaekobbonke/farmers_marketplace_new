import { Request, Response } from "express";
import { ProductService } from "./product.service";

export class ProductController {
  
  /**
   * Get all products for marketplace (public)
   * GET /api/products
   */
  static getAll = async (req: Request, res: Response) => {
    try {
      const products = await ProductService.getAll();
      res.json({ 
        success: true, 
        data: products,
        meta: {
          count: products.length
        }
      });
    } catch (error: any) {
      console.error("Error fetching products:", error.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch products",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Get single product by ID with view tracking (public)
   * GET /api/products/:id
   */
  static getById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }
      
      const product = await ProductService.getById(id, true);
      
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: "Product not found" 
        });
      }
      
      res.json({ 
        success: true, 
        data: product 
      });
    } catch (error: any) {
      console.error("Error fetching product:", error.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch product",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Get farmer's own products (authenticated)
   * GET /api/products/farmer/products
   */
  static getFarmerProducts = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }
      
      const products = await ProductService.getFarmerProducts(userId);
      res.json({ 
        success: true, 
        data: products,
        meta: {
          count: products.length
        }
      });
    } catch (error: any) {
      console.error("Error fetching farmer products:", error.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch your products",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Get farmer's dashboard stats (authenticated)
   * GET /api/products/farmer/stats
   */
  static getFarmerStats = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }
      
      const stats = await ProductService.getFarmerStats(userId);
      res.json({ 
        success: true, 
        data: stats 
      });
    } catch (error: any) {
      console.error("Error fetching farmer stats:", error.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch dashboard stats",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Create new product (farmer only)
   * POST /api/products
   */
  static create = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }

      // Check if user is a farmer or admin
      if (req.user?.role !== "FARMER" && req.user?.role !== "ADMIN") {
        return res.status(403).json({ 
          success: false, 
          message: "Only farmers can create products" 
        });
      }
      
      const { name, description, price, quantity, stockQuantity, categoryId, unit, location, tags } = req.body;
      
      // Validate required fields
      const missingFields: string[] = [];
      if (!name) missingFields.push("name");
      if (!description) missingFields.push("description");
      if (!price && price !== 0) missingFields.push("price");
      if (!quantity && quantity !== 0) missingFields.push("quantity");
      if (!categoryId && categoryId !== 0) missingFields.push("categoryId");
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Missing required fields: ${missingFields.join(", ")}`,
          missingFields
        });
      }
      
      const priceNum = parseFloat(price);
      const quantityNum = parseFloat(quantity);
      const categoryIdNum = parseInt(categoryId, 10);

      // stockQuantity is OPTIONAL - Using undefined to align with ProductData types
      let stockQtyNum: number | undefined = undefined;

      if (
        stockQuantity !== undefined &&
        stockQuantity !== null &&
        stockQuantity !== ""
      ) {
        const parsedStock = parseInt(stockQuantity, 10);

        if (isNaN(parsedStock) || parsedStock < 0) {
          return res.status(400).json({
            success: false,
            message: "Stock quantity available must be a non-negative integer"
          });
        }
        stockQtyNum = parsedStock;
      }
      
      if (isNaN(priceNum) || priceNum <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Price must be a positive number" 
        });
      }
      
      if (isNaN(quantityNum) || quantityNum <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Pack size or quantity must be a positive number" 
        });
      }
      
      if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Valid category ID is required" 
        });
      }
      
      const productData = {
        name: name.trim(),
        description: description.trim(),
        price: priceNum,
        quantity: quantityNum,
        stockQuantity: stockQtyNum ?? undefined, 
        categoryId: categoryIdNum,
        unit: unit || "piece",
        location: location || null,
        tags: tags || null
      };
      
      const product = await ProductService.create(userId, productData);
      
      res.status(201).json({ 
        success: true, 
        data: product, 
        message: "Product created successfully and pending admin approval" 
      });
    } catch (error: any) {
      console.error("Error creating product:", error.message);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to create product",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Update product (farmer or admin)
   * PATCH /api/products/:id
   */
  static update = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const id = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }
      
      // Validate update data
      const updateData: Record<string, any> = {};
      const allowedFields = ["name", "description", "price", "quantity", "stockQuantity", "categoryId", "unit", "location", "tags"];
      
      for (const field of allowedFields) {
        const value = req.body[field];
        if (value !== undefined && value !== null) {
          if (field === "price") {
            const priceNum = parseFloat(value);
            if (isNaN(priceNum) || priceNum <= 0) {
              return res.status(400).json({ 
                success: false, 
                message: "Price must be a positive number" 
              });
            }
            updateData[field] = priceNum;
          } else if (field === "quantity") {
            const quantityNum = parseFloat(value);
            if (isNaN(quantityNum) || quantityNum <= 0) {
              return res.status(400).json({ 
                success: false, 
                message: "Quantity dimension pack must be a positive number" 
              });
            }
            updateData[field] = quantityNum;
          } else if (field === "stockQuantity") {
            const stockQtyNum = parseInt(value, 10);
            if (isNaN(stockQtyNum) || stockQtyNum < 0) {
              return res.status(400).json({
                success: false,
                message: "Stock counts cannot drop beneath zero values"
              });
            }
            updateData[field] = stockQtyNum;
          } else if (field === "categoryId") {
            const categoryIdNum = parseInt(value, 10);
            if (isNaN(categoryIdNum) || categoryIdNum <= 0) {
              return res.status(400).json({ 
                success: false, 
                message: "Valid category ID is required" 
              });
            }
            updateData[field] = categoryIdNum;
          } else {
            updateData[field] = typeof value === 'string' ? value.trim() : value;
          }
        }
      }
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No valid fields to update" 
        });
      }
      
      const product = await ProductService.update(id, userId, updateData, req.user?.role);
      
      res.json({ 
        success: true, 
        data: product, 
        message: "Product updated successfully" 
      });
    } catch (error: any) {
      console.error("Error updating product:", error.message);
      if (error.message === "Product not found") {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      if (error.message === "Unauthorized") {
        return res.status(403).json({ 
          success: false, 
          message: "You don't have permission to update this product" 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to update product",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Delete product (farmer or admin)
   * DELETE /api/products/:id
   */
  static remove = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const id = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }
      
      await ProductService.remove(id, userId, req.user?.role);
      
      res.json({ 
        success: true, 
        message: "Product deleted successfully" 
      });
    } catch (error: any) {
      console.error("Error deleting product:", error.message);
      if (error.message === "Product not found") {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      if (error.message === "Unauthorized") {
        return res.status(403).json({ 
          success: false, 
          message: "You don't have permission to delete this product" 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to delete product",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Get all products for admin (admin only)
   * GET /api/products/admin/all
   */
  static getAllProductsAdmin = async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ 
          success: false, 
          message: "Admin access required" 
        });
      }
      
      const products = await ProductService.getAllProductsAdmin();
      res.json({ 
        success: true, 
        data: products,
        meta: {
          count: products.length
        }
      });
    } catch (error: any) {
      console.error("Error fetching admin products:", error.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch products",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Verify product (admin only)
   * PATCH /api/products/admin/:id/verify
   */
  static verifyProduct = async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ 
          success: false, 
          message: "Admin access required" 
        });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }
      
      const product = await ProductService.verifyProduct(id);
      
      res.json({ 
        success: true, 
        data: product, 
        message: "Product verified successfully. Farmer has been notified." 
      });
    } catch (error: any) {
      console.error("Error verifying product:", error.message);
      if (error.message === "Product not found") {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to verify product",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Reject product (admin only)
   * DELETE /api/products/admin/:id/reject
   */
  static rejectProduct = async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ 
          success: false, 
          message: "Admin access required" 
        });
      }
      
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }
      
      const product = await ProductService.rejectProduct(id, reason);
      
      res.json({ 
        success: true, 
        data: product, 
        message: "Product rejected successfully. Farmer has been notified." 
      });
    } catch (error: any) {
      console.error("Error rejecting product:", error.message);
      if (error.message === "Product not found") {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to reject product",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Feature/unfeature product (admin only)
   * PATCH /api/products/admin/:id/feature
   */
  static featureProduct = async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ 
          success: false, 
          message: "Admin access required" 
        });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }
      
      const product = await ProductService.featureProduct(id);
      const tags = product.tags as string | null;
      const isFeatured = tags?.includes("featured");
      
      res.json({ 
        success: true, 
        data: product, 
        message: isFeatured 
          ? "Product featured successfully. Farmer has been notified." 
          : "Product unfeatured successfully." 
      });
    } catch (error: any) {
      console.error("Error featuring product:", error.message);
      if (error.message === "Product not found") {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to feature product",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Get products by category (public)
   * GET /api/products/category/:categoryId
   */
  static getProductsByCategory = async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid category ID" 
        });
      }
      
      const products = await ProductService.getProductsByCategory(categoryId);
      res.json({ 
        success: true, 
        data: products,
        meta: {
          count: products.length,
          categoryId
        }
      });
    } catch (error: any) {
      console.error("Error fetching products by category:", error.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch products",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Search products (public)
   * GET /api/products/search?q=keyword
   */
  static searchProducts = async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ 
          success: false, 
          message: "Search query is required" 
        });
      }
      
      if (q.trim().length < 2) {
        return res.status(400).json({ 
          success: false, 
          message: "Search query must be at least 2 characters" 
        });
      }
      
      const products = await ProductService.searchProducts(q);
      res.json({ 
        success: true, 
        data: products,
        meta: {
          query: q,
          count: products.length
        }
      });
    } catch (error: any) {
      console.error("Error searching products:", error.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to search products",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Get featured products (public)
   * GET /api/products/featured?limit=6
   */
  static getFeaturedProducts = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string) || 6, 20) : 6;
      const products = await ProductService.getFeaturedProducts(limit);
      
      res.json({ 
        success: true, 
        data: products,
        meta: {
          limit,
          count: products.length
        }
      });
    } catch (error: any) {
      console.error("Error fetching featured products:", error.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch featured products",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Update product stock (farmer or admin)
   * PATCH /api/products/:id/stock
   */
  static updateStock = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const id = parseInt(req.params.id);
      const { quantitySold } = req.body;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }
      
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }
      
      if (!quantitySold || isNaN(quantitySold) || quantitySold <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Valid quantity sold is required" 
        });
      }
      
      const product = await ProductService.updateStock(id, quantitySold);
      
      res.json({ 
        success: true, 
        data: product, 
        message: "Stock updated successfully" 
      });
    } catch (error: any) {
      console.error("Error updating stock:", error.message);
      if (error.message === "Product not found") {
        return res.status(404).json({ 
          success: false, 
          message: error.message 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to update stock",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Get low stock products (farmer only)
   * GET /api/products/farmer/low-stock?threshold=10
   */
  static getLowStockProducts = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }
      
      const products = await ProductService.getLowStockProducts(userId, threshold);
      
      res.json({ 
        success: true, 
        data: products,
        meta: {
          threshold,
          count: products.length
        }
      });
    } catch (error: any) {
      console.error("Error fetching low stock products:", error.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch low stock products",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Get top viewed products (public)
   * GET /api/products/top-viewed?limit=10
   */
  static getTopViewedProducts = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? Math.min(parseInt(req.query.limit as string) || 10, 50) : 10;
      const products = await ProductService.getTopViewedProducts(limit);
      
      res.json({ 
        success: true, 
        data: products,
        meta: {
          limit,
          count: products.length
        }
      });
    } catch (error: any) {
      console.error("Error fetching top viewed products:", error.message);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch top viewed products",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };

  /**
   * Get product analytics for farmer (authenticated)
   * GET /api/products/farmer/analytics?period=week
   */
  static getProductAnalytics = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const period = req.query.period as string || "week";
      
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          message: "Authentication required" 
        });
      }
      
      const validPeriods = ["week", "month", "year"];
      if (!validPeriods.includes(period)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid period. Use week, month, or year" 
        });
      }
      
      const analytics = await ProductService.getProductAnalytics(userId, period);
      
      res.json({ 
        success: true, 
        data: analytics 
      });
    } catch (error: any) {
      console.error("Error fetching product analytics:", error.message);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch product analytics",
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  };
}

export default ProductController;
