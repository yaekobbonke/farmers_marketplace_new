import { Request, Response } from 'express';
import { PriceService } from './price.service';

export class PriceController {
  static async getPrediction(req: Request, res: Response) {
    try {
      // ✅ Fixed: Type assertion for params.id
      const productId = parseInt(req.params.id as string);
      
      if (isNaN(productId)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid Product ID provided." 
        });
      }

      const result = await PriceService.getAIPrediction(productId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error("❌ Prediction Controller Error:", error.message);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to generate AI price prediction"
      });
    }
  }

  static async getLatestPrices(req: Request, res: Response) {
    try {
      // ✅ Fixed: Handle query parameter properly
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 15;
      const result = await PriceService.getRecentMarketSnapshots(limit);
      return res.status(200).json(result);
    } catch (error) {
      console.error("❌ Fetch Latest Prices Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve market snapshots for AI Assistant"
      });
    }
  }

  static async syncScrapedData(req: Request, res: Response) {
    try {
      const internalSecret = req.headers['x-internal-secret'];
      if (!internalSecret || internalSecret !== process.env.INTERNAL_SECRET) {
        return res.status(401).json({ 
          success: false, 
          message: "Unauthorized: Scraper access denied." 
        });
      }

      const result = await PriceService.processScrapedData(req.body);

      if (!result) {
        return res.status(200).json({ 
          success: true, 
          message: "Scraped data ignored: Commodity name not mapped in local database." 
        });
      }

      return res.status(201).json({
        success: true,
        message: "Market intelligence synced successfully",
        data: result
      });
    } catch (error: any) {
      console.error("❌ Scraper Sync Error:", error.message);
      return res.status(400).json({
        success: false,
        message: error.message || "Data format mismatch during sync"
      });
    }
  }
}