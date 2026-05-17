import { Request, Response } from "express";
import { ProductService } from "./product.service";

// Extend Request to include user property
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: "FARMER" | "BUYER" | "ADMIN";
    is_suspended?: boolean;
  };
}

export class ProductController {
  
  // ✅ Get all products for marketplace
  static getAll = async (req: Request, res: Response) => {
    try {
      const products = await ProductService.getAll();
      res.json({ success: true, data: products });
    } catch (error: any) {
      console.error("Error fetching products:", error.message);
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
      console.error("Error fetching product:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get farmer's own products
  static getFarmerProducts = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const products = await ProductService.getFarmerProducts(userId);
      res.json({ success: true, data: products });
    } catch (error: any) {
      console.error("Error fetching farmer products:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get farmer's dashboard stats
  static getFarmerStats = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const stats = await ProductService.getFarmerStats(userId);
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error("Error fetching farmer stats:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Create new product
  static create = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      // Validate required fields
      const { name, description, price, quantity, categoryId } = req.body;
      if (!name || !description || !price || !quantity || !categoryId) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields: name, description, price, quantity, categoryId" 
        });
      }
      
      const product = await ProductService.create(userId, req.body);
      res.status(201).json({ 
        success: true, 
        data: product, 
        message: "Product created successfully and pending admin approval" 
      });
    } catch (error: any) {
      console.error("Error creating product:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Update product
  static update = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const id = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      const product = await ProductService.update(id, userId, req.body, req.user?.role);
      res.json({ success: true, data: product, message: "Product updated successfully" });
    } catch (error: any) {
      console.error("Error updating product:", error.message);
      if (error.message === "Product not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message === "Unauthorized") {
        return res.status(403).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Delete product
  static remove = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const id = parseInt(req.params.id);
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      await ProductService.remove(id, userId, req.user?.role);
      res.json({ success: true, message: "Product deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting product:", error.message);
      if (error.message === "Product not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      if (error.message === "Unauthorized") {
        return res.status(403).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get all products for admin
  static getAllProductsAdmin = async (req: AuthRequest, res: Response) => {
    try {
      // Check admin role
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
      
      const products = await ProductService.getAllProductsAdmin();
      res.json({ success: true, data: products });
    } catch (error: any) {
      console.error("Error fetching admin products:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Verify product (admin only) - WITH NOTIFICATION TO FARMER
  static verifyProduct = async (req: AuthRequest, res: Response) => {
    try {
      // Check admin role
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
      
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
      console.error("Error verifying product:", error.message);
      if (error.message === "Product not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Reject product (admin only) - WITH NOTIFICATION TO FARMER
  static rejectProduct = async (req: AuthRequest, res: Response) => {
    try {
      // Check admin role
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
      
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
      console.error("Error rejecting product:", error.message);
      if (error.message === "Product not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Feature product (admin only) - WITH NOTIFICATION TO FARMER
  static featureProduct = async (req: AuthRequest, res: Response) => {
    try {
      // Check admin role
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ success: false, message: "Admin access required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      const product = await ProductService.featureProduct(id);
      res.json({ 
        success: true, 
        data: product, 
        message: product.tags?.includes("featured") 
          ? "Product featured successfully. Farmer has been notified." 
          : "Product unfeatured successfully." 
      });
    } catch (error: any) {
      console.error("Error featuring product:", error.message);
      if (error.message === "Product not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
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
      console.error("Error fetching products by category:", error.message);
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
      console.error("Error searching products:", error.message);
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
      console.error("Error fetching featured products:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Update product stock
  static updateStock = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const id = parseInt(req.params.id);
      const { quantitySold } = req.body;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: "Invalid product ID" });
      }
      
      if (!quantitySold || isNaN(quantitySold) || quantitySold <= 0) {
        return res.status(400).json({ success: false, message: "Valid quantity sold is required" });
      }
      
      const product = await ProductService.updateStock(id, quantitySold);
      res.json({ success: true, data: product, message: "Stock updated successfully" });
    } catch (error: any) {
      console.error("Error updating stock:", error.message);
      if (error.message === "Product not found") {
        return res.status(404).json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get low stock products
  static getLowStockProducts = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const products = await ProductService.getLowStockProducts(userId, threshold);
      res.json({ success: true, data: products });
    } catch (error: any) {
      console.error("Error fetching low stock products:", error.message);
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
      console.error("Error fetching top viewed products:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ✅ Get product analytics for farmer
  static getProductAnalytics = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id;
      const period = req.query.period as string || "week";
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      // Validate period
      const validPeriods = ["week", "month", "year"];
      if (!validPeriods.includes(period)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid period. Use week, month, or year" 
        });
      }
      
      const analytics = await ProductService.getProductAnalytics(userId, period);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error("Error fetching product analytics:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  };
}

export default ProductController;