import { Request, Response } from "express";
import { AnalyticsService } from "./analytics.service";

// Extend Request to include user property
interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: "FARMER" | "BUYER" | "ADMIN";
    is_suspended?: boolean;
  };
}

export class AnalyticsController {
  
  static async getFarmerOverview(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const overview = await AnalyticsService.getFarmerOverview(userId);
      res.json({ success: true, data: overview });
    } catch (error: any) {
      console.error("Error fetching farmer overview:", error.message);
      res.status(500).json({ success: false, message: error.message || "Failed to fetch farmer overview" });
    }
  }
  
  static async getFarmerProductAnalytics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const { period = "week" } = req.query;
      const validPeriods = ["week", "month", "year"];
      
      if (!validPeriods.includes(period as string)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid period. Use week, month, or year" 
        });
      }
      
      const analytics = await AnalyticsService.getFarmerProductAnalytics(userId, period as string);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error("Error fetching product analytics:", error.message);
      res.status(500).json({ success: false, message: error.message || "Failed to fetch product analytics" });
    }
  }
  
  static async getFarmerSalesAnalytics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const { period = "month" } = req.query;
      const validPeriods = ["week", "month", "year"];
      
      if (!validPeriods.includes(period as string)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid period. Use week, month, or year" 
        });
      }
      
      const analytics = await AnalyticsService.getFarmerSalesAnalytics(userId, period as string);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error("Error fetching sales analytics:", error.message);
      res.status(500).json({ success: false, message: error.message || "Failed to fetch sales analytics" });
    }
  }
  
  static async getFarmerViewsAnalytics(req: AuthRequest, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      const analytics = await AnalyticsService.getFarmerViewsAnalytics(userId);
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error("Error fetching views analytics:", error.message);
      res.status(500).json({ success: false, message: error.message || "Failed to fetch views analytics" });
    }
  }
  
  static async getAdminOverview(req: AuthRequest, res: Response) {
    try {
      // Check admin role
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ 
          success: false, 
          message: "Admin access required" 
        });
      }
      
      const overview = await AnalyticsService.getAdminOverview();
      res.json({ success: true, data: overview });
    } catch (error: any) {
      console.error("Error fetching admin overview:", error.message);
      res.status(500).json({ success: false, message: error.message || "Failed to fetch admin overview" });
    }
  }
  
  static async getAdminProductAnalytics(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ 
          success: false, 
          message: "Admin access required" 
        });
      }
      
      const analytics = await AnalyticsService.getAdminProductAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error("Error fetching admin product analytics:", error.message);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch product analytics" 
      });
    }
  }
  
  static async getAdminUserAnalytics(req: AuthRequest, res: Response) {
    try {
      if (req.user?.role !== "ADMIN") {
        return res.status(403).json({ 
          success: false, 
          message: "Admin access required" 
        });
      }
      
      const analytics = await AnalyticsService.getAdminUserAnalytics();
      res.json({ success: true, data: analytics });
    } catch (error: any) {
      console.error("Error fetching admin user analytics:", error.message);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch user analytics" 
      });
    }
  }
}

export default AnalyticsController;