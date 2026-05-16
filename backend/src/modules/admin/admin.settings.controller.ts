import { Request, Response } from "express";
import { AdminSettingsService } from "./admin.settings.service";

export class AdminSettingsController {
  
  static async getSettings(req: Request, res: Response) {
    try {
      const settings = await AdminSettingsService.getSettings();
      res.json({ success: true, data: settings });
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      
      // Handle specific error types
      if (error.code === 'P2021') {
        // Table doesn't exist yet
        return res.status(200).json({ 
          success: true, 
          data: null,
          message: "Settings not initialized yet" 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch settings" 
      });
    }
  }
  
  static async updateSettings(req: Request, res: Response) {
    try {
      // Validate request body
      if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ 
          success: false, 
          message: "No settings data provided" 
        });
      }
      
      const settings = await AdminSettingsService.updateSettings(req.body);
      res.json({ 
        success: true, 
        data: settings,
        message: "Settings updated successfully"
      });
    } catch (error: any) {
      console.error("Error updating settings:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to update settings" 
      });
    }
  }
  
  static async clearCache(req: Request, res: Response) {
    try {
      await AdminSettingsService.clearCache();
      res.json({ 
        success: true, 
        message: "Cache cleared successfully" 
      });
    } catch (error: any) {
      console.error("Error clearing cache:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to clear cache" 
      });
    }
  }
  
  static async seedSettings(req: Request, res: Response) {
    try {
      // Optional: Add authentication check for seeding
      const apiKey = req.headers['x-api-key'];
      if (apiKey !== process.env.ADMIN_API_KEY) {
        return res.status(401).json({ 
          success: false, 
          message: "Unauthorized: Invalid API key" 
        });
      }
      
      await AdminSettingsService.seedDefaultSettings();
      res.json({ 
        success: true, 
        message: "Default settings seeded successfully" 
      });
    } catch (error: any) {
      console.error("Error seeding settings:", error);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to seed settings" 
      });
    }
  }
}