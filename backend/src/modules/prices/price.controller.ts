import { Request, Response } from 'express';
import { PriceService } from './price.service';

export class PriceController {
  /**
   * GET /api/v1/prices/:id/predict
   * Triggers the XGBoost forecasting logic by fusing 3 data sources.
   */
  static async getPrediction(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.id);
      
      if (isNaN(productId)) {
        return res.status(400).json({ success: false, message: "Invalid Product ID" });
      }

      const result = await PriceService.getAIPrediction(productId);
      
      return res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      console.error("Prediction Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate AI price prediction"
      });
    }
  }

  /**
   * POST /api/v1/prices/internal/sync
   * Receives real-time market data from the Python BeautifulSoup scraper.
   */
  /**
   * GET /api/v1/prices/latest
   * Provides a snapshot of the most recent scraped market data.
   * Used by the Python AI service to provide real-time context to Llama 3.
   */
  static async getLatestPrices(req: Request, res: Response) {
    try {
      // Delegate to service to fetch the latest N records from the database
      const result = await PriceService.getRecentMarketSnapshots(15);

      return res.status(200).json(result); 
      // Note: We return raw array here to make it easier for Python's httpx to parse
    } catch (error) {
      console.error("Fetch Latest Prices Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve market snapshots"
      });
    }
  }
  
  static async syncScrapedData(req: Request, res: Response) {
    try {
      // 1. Security: Check for Internal API Secret
      const internalSecret = req.headers['x-internal-secret'];
      if (internalSecret !== process.env.INTERNAL_SECRET) {
        return res.status(401).json({ success: false, message: "Unauthorized internal access" });
      }

      // 2. Delegate to Service for Product Mapping and DB Insertion
      const result = await PriceService.processScrapedData(req.body);

      return res.status(201).json({
        success: true,
        message: "Market data synced successfully",
        data: result
      });
    } catch (error: any) {
      console.error("Scraper Sync Error:", error.message);
      return res.status(400).json({
        success: false,
        message: error.message || "Failed to sync scraped data"
      });
    }
  }
}