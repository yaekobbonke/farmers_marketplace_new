import { Request, Response } from 'express';
import { PriceService } from './price.service';

export class PriceController {
  /**
   * GET /api/v1/prices/:id/predict
   * Fuses data from SQL, Scraper (JSON), and historical records to trigger XGBoost.
   */
  static async getPrediction(req: Request, res: Response) {
    try {
      const productId = parseInt(req.params.id);
      
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

  /**
   * GET /api/v1/prices/latest
   * Provides a live snapshot for the Python Llama 3 AgriSmart Assistant.
   * Now resilient: returns Farmer Listings if Scraper data is missing.
   */
  static async getLatestPrices(req: Request, res: Response) {
    try {
      // Increase limit to 15 for a wider variety of context for the LLM
      const result = await PriceService.getRecentMarketSnapshots(15);

      /**
       * CRITICAL FOR FASTAPI: 
       * We return the raw array directly. Python's httpx.get() expects 
       * a clean list [{}, {}] to iterate over it and build the prompt.
       */
      return res.status(200).json(result); 
    } catch (error) {
      console.error("❌ Fetch Latest Prices Error:", error);
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve market snapshots for AI Assistant"
      });
    }
  }

  /**
   * POST /api/v1/prices/internal/sync
   * Endpoint for the BeautifulSoup scraper to push real-time ECX data.
   */
  static async syncScrapedData(req: Request, res: Response) {
    try {
      // 1. Security check: Only the internal Python scraper should hit this
      const internalSecret = req.headers['x-internal-secret'];
      if (!internalSecret || internalSecret !== process.env.INTERNAL_SECRET) {
        return res.status(401).json({ 
          success: false, 
          message: "Unauthorized: Scraper access denied." 
        });
      }

      // 2. Process data (Maps 'Maize' -> Product ID 14 -> MarketPrice Entry)
      const result = await PriceService.processScrapedData(req.body);

      // If mapping fails (Product not in DB), we return 200 but notify the logs
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