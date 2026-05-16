"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceController = void 0;
const price_service_1 = require("./price.service");
class PriceController {
    static async getPrediction(req, res) {
        try {
            const productId = parseInt(req.params.id);
            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid Product ID provided."
                });
            }
            const result = await price_service_1.PriceService.getAIPrediction(productId);
            return res.status(200).json({
                success: true,
                data: result
            });
        }
        catch (error) {
            console.error("❌ Prediction Controller Error:", error.message);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to generate AI price prediction"
            });
        }
    }
    static async getLatestPrices(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 15;
            const validLimit = isNaN(limit) ? 15 : Math.min(limit, 100);
            const result = await price_service_1.PriceService.getRecentMarketSnapshots(validLimit);
            return res.status(200).json({
                success: true,
                data: result,
                count: result.length
            });
        }
        catch (error) {
            console.error("❌ Fetch Latest Prices Error:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to retrieve market snapshots for AI Assistant"
            });
        }
    }
    static async syncScrapedData(req, res) {
        try {
            const internalSecret = req.headers['x-internal-secret'];
            if (!internalSecret || internalSecret !== process.env.INTERNAL_SECRET) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Scraper access denied."
                });
            }
            if (!req.body || !req.body.name || !req.body.price) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid request body. Required fields: name, price"
                });
            }
            const result = await price_service_1.PriceService.processScrapedData(req.body);
            if (!result) {
                return res.status(200).json({
                    success: true,
                    message: "Scraped data ignored: Commodity name not mapped in local database.",
                    mapped: false
                });
            }
            return res.status(201).json({
                success: true,
                message: "Market intelligence synced successfully",
                data: result,
                mapped: true
            });
        }
        catch (error) {
            console.error("❌ Scraper Sync Error:", error.message);
            return res.status(400).json({
                success: false,
                message: error.message || "Data format mismatch during sync"
            });
        }
    }
}
exports.PriceController = PriceController;
