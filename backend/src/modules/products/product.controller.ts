import { Request, Response } from "express";
import { ProductService } from "./product.service";

export class ProductController {
  
  // ✅ Get all products for marketplace
  static getAll = async (req: Request, res: Response) => {
    try {
      const products = await ProductService.getAll();
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get single product by ID - with view tracking
  static getById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      // ✅ Increment view count via service
      const product = await ProductService.getById(id, true);
      
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }
      
      res.json({ success: true, data: product });
    } catch (error: any) {
      console.error("Error fetching product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get farmer's own products
  static getFarmerProducts = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const products = await ProductService.getFarmerProducts(userId);
      res.json({ success: true, data: products });
    } catch (error: any) {
      console.error("Error fetching farmer products:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get farmer's dashboard stats
  static getFarmerStats = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const stats = await ProductService.getFarmerStats(userId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error("Error fetching farmer stats:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Create new product
  static create = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const product = await ProductService.create(userId, req.body);
      res.status(201).json({ 
        success: true, 
        data: product, 
        message: "Product created successfully and pending admin approval" 
      });
    } catch (error: any) {
      console.error("Error creating product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Update product
  static update = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      const product = await ProductService.update(id, userId, req.body, req.user?.role);
      res.json({ success: true, data: product, message: "Product updated successfully" });
    } catch (error: any) {
      console.error("Error updating product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Delete product
  static remove = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      await ProductService.remove(id, userId, req.user?.role);
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get all products for admin
  static getAllProductsAdmin = async (req: Request, res: Response) => {
    try {
      const products = await ProductService.getAllProductsAdmin();
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Verify product (admin only) - WITH NOTIFICATION TO FARMER
  static verifyProduct = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      const product = await ProductService.verifyProduct(id);
      res.json({ 
        success: true, 
        data: product, 
        message: "Product verified successfully. Farmer has been notified." 
      });
    } catch (error: any) {
      console.error("Error verifying product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Reject product (admin only) - WITH NOTIFICATION TO FARMER
  static rejectProduct = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { reason } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      const product = await ProductService.rejectProduct(id, reason);
      res.json({ 
        success: true, 
        data: product, 
        message: "Product rejected successfully. Farmer has been notified." 
      });
    } catch (error: any) {
      console.error("Error rejecting product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Feature product (admin only) - WITH NOTIFICATION TO FARMER
  static featureProduct = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      const product = await ProductService.featureProduct(id);
      res.json({ 
        success: true, 
        data: product, 
        message: "Product featured successfully. Farmer has been notified." 
      });
    } catch (error: any) {
      console.error("Error featuring product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get products by category
  static getProductsByCategory = async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ success: false, message: "Invalid category ID" });
      }
      
      const products = await ProductService.getProductsByCategory(categoryId);
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Search products
  static searchProducts = async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ success: false, message: "Search query is required" });
      }
      
      const products = await ProductService.searchProducts(q);
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get featured products
  static getFeaturedProducts = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
      const products = await ProductService.getFeaturedProducts(limit);
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Update product stock
  static updateStock = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const { quantitySold } = req.body;
      
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      if (!quantitySold || isNaN(quantitySold)) {
        return res.status(400).json({ success: false, message: "Quantity sold is required" });
      }
      
      const product = await ProductService.updateStock(id, quantitySold);
      res.json({ success: true, data: product, message: "Stock updated successfully" });
    } catch (error: any) {
      console.error("Error updating stock:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get low stock products
  static getLowStockProducts = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const products = await ProductService.getLowStockProducts(userId, threshold);
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get top viewed products for analytics
  static getTopViewedProducts = async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const products = await ProductService.getTopViewedProducts(limit);
      res.json({ success: true, data: products });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get product analytics for farmer
  static getProductAnalytics = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const period = req.query.period as string || "week";
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const analytics = await ProductService.getProductAnalytics(userId, period);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error("Error fetching product analytics:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
}