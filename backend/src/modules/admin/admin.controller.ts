import { Request, Response } from "express";
import { AdminService } from "./admin.service";
import { ProductService } from "../products/product.service";

// Extend Request to include user property
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: "FARMER" | "BUYER" | "ADMIN";
    is_suspended?: boolean;
  };
}

export class AdminController {
  static async getStats(req: Request, res: Response) {
    try {
      const stats = await AdminService.getStats();
      res.json({ success: true, data: stats });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await AdminService.getAllUsers();
      res.json({ success: true, data: users });
    } catch (error: any) {
      console.error("Error fetching users:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async updateUserRole(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const { role } = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }
      
      if (!role || !["ADMIN", "FARMER", "BUYER"].includes(role)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid role. Must be ADMIN, FARMER, or BUYER" 
        });
      }
      
      const updated = await AdminService.updateUserRole(userId, role);
      res.json({ 
        success: true, 
        data: updated,
        message: `User role updated to ${role} successfully`
      });
    } catch (error: any) {
      console.error("❌ Update role error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async toggleSuspendUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const { isSuspended } = req.body;
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }
      
      if (isSuspended === undefined) {
        return res.status(400).json({ 
          success: false, 
          message: "isSuspended field is required" 
        });
      }
      
      const updated = await AdminService.toggleSuspendUser(userId, isSuspended);
      res.json({ 
        success: true, 
        data: updated,
        message: isSuspended ? "User suspended successfully" : "User unsuspended successfully"
      });
    } catch (error: any) {
      console.error("Error toggling user suspension:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async suspendUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }
      
      const updated = await AdminService.suspendUser(userId);
      res.json({ success: true, data: updated, message: "User suspended successfully" });
    } catch (error: any) {
      console.error("Error suspending user:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async unsuspendUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }
      
      const updated = await AdminService.unsuspendUser(userId);
      res.json({ success: true, data: updated, message: "User unsuspended successfully" });
    } catch (error: any) {
      console.error("Error unsuspending user:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const userId = parseInt(req.params.userId);
      const authReq = req as AuthRequest;
      const currentAdminId = authReq.user?.id;
      
      if (isNaN(userId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid user ID" 
        });
      }
      
      if (currentAdminId === userId) {
        return res.status(400).json({ 
          success: false, 
          message: "You cannot delete your own account. Use account settings instead." 
        });
      }
      
      const deleted = await AdminService.deleteUser(userId);
      res.json({ 
        success: true, 
        data: deleted,
        message: `User ${deleted.first_name} ${deleted.last_name} has been deleted successfully`
      });
    } catch (error: any) {
      console.error("❌ Delete user error:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getRecentActivity(req: Request, res: Response) {
    try {
      const activity = await AdminService.getRecentActivity();
      res.json({ success: true, data: activity });
    } catch (error: any) {
      console.error("❌ Error fetching recent activity:", error.message);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  static async getSalesData(req: Request, res: Response) {
    try {
      const { range } = req.query;
      let validRange: "week" | "month" | "year" = "month";
      
      if (range === "week" || range === "year") {
        validRange = range;
      }
      
      const salesData = await AdminService.getSalesData(validRange);
      
      res.json({ 
        success: true, 
        data: salesData.data,
        summary: salesData.summary
      });
    } catch (error: any) {
      console.error("❌ Error fetching sales data:", error.message);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch sales data" 
      });
    }
  }

  // Get all products for admin - This stays with AdminService
  static async getAllProducts(req: Request, res: Response) {
    try {
      const products = await AdminService.getAllProducts();
      res.json({ success: true, data: products });
    } catch (error: any) {
      console.error("Error fetching products:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Verify a product - Using ProductService (has duplicate prevention)
  static async verifyProduct(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.productId);
      
      if (isNaN(productId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }
      
      console.log(`🔍 Admin verifying product: ${productId}`);
      
      const product = await ProductService.verifyProduct(productId);
      
      res.json({ 
        success: true, 
        data: product,
        message: "Product verified successfully. Farmer has been notified." 
      });
    } catch (error: any) {
      console.error("Error verifying product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Feature a product - Using ProductService (has duplicate prevention)
  static async featureProduct(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.productId);
      
      if (isNaN(productId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }
      
      console.log(`🌟 Admin featuring product: ${productId}`);
      
      const product = await ProductService.featureProduct(productId);
      
      res.json({ 
        success: true, 
        data: product,
        message: "Product featured successfully. Farmer has been notified." 
      });
    } catch (error: any) {
      console.error("Error featuring product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ✅ Delete a product - Using ProductService (has duplicate prevention)
  static async deleteProduct(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.productId);
      const authReq = req as AuthRequest;
      const adminId = authReq.user?.id;
      
      if (isNaN(productId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid product ID" 
        });
      }
      
      if (!adminId) {
        return res.status(401).json({ 
          success: false, 
          message: "Not authenticated" 
        });
      }
      
      console.log(`🗑️ Admin deleting product: ${productId}`);
      
      await ProductService.remove(productId, adminId, "ADMIN");
      
      res.json({ 
        success: true, 
        message: "Product deleted successfully. Farmer has been notified." 
      });
    } catch (error: any) {
      console.error("Error deleting product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  }
}