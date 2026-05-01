"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceService = void 0;
const price_provider_1 = require("./price.provider");
const ai_client_1 = require("../../lib/ai-client");
class PriceService {
    /**
     * Orchestrates the 3-source AI prediction.
     */
    static async getAIPrediction(productId) {
        // 1. Fetch data with the safety check from provider
        const signals = await price_provider_1.PriceProvider.getPriceSignals(productId);
        // Check if the product even exists before trying to predict
        if (!signals || signals.product_name === "Unknown") {
            throw new Error("Could not retrieve valid product signals for prediction.");
        }
        try {
            // 2. Call FastAPI Forecast Engine
            // Ensure the keys match what your Python FastAPI PriceInference schema expects
            const response = await ai_client_1.aiClient.post('/forecast/predict', {
                admin1: "ADDIS ABABA", // Defaulting for general prediction context
                market_id: 1,
                commodity_id: productId,
                category: "CEREALS",
                commodity: signals.product_name,
                latitude: 9.02,
                longitude: 38.75,
                rfq: signals.scraped_price || signals.farmer_price, // Use scraped as baseline if available
                r3q: signals.historical_avg
            });
            const prediction = response.data.prediction.predicted_price_etb;
            // 3. Persist prediction to PostgreSQL only if valid
            if (prediction) {
                await price_provider_1.PriceProvider.savePrediction(productId, prediction);
            }
            return {
                product: signals.product_name,
                current: signals.farmer_price,
                market_average: signals.scraped_price,
                predicted: prediction,
                trend: prediction > signals.farmer_price ? "Increasing" : "Decreasing",
                confidence: response.data.metadata.data_freshness || "standard"
            };
        }
        catch (error) {
            console.error("❌ AI Forecast Engine unreachable:", error);
            return {
                product: signals.product_name,
                current: signals.farmer_price,
                predicted: null,
                error: "AI engine temporarily offline. Please try again later."
            };
        }
    }
    /**
     * Provides a structured feed for the Llama 3 chatbot.
     * Now handles the resilient mapping from the updated provider.
     */
    static async getRecentMarketSnapshots(limit = 10) {
        const rawData = await price_provider_1.PriceProvider.getRecentMarketSnapshots(limit);
        return rawData.map(item => ({
            commodity: item.product || "Agricultural Commodity", // Matches the .product key from resilient provider
            price: item.price,
            market: item.market,
            source: item.source,
            unit: item.unit,
            // Formatting the date for the AgriSmart chat interface
            recordedAt: item.recordedAt ? new Date(item.recordedAt).toLocaleDateString('en-GB') : "Recently"
        }));
    }
    /**
     * Processes data pushed from the BeautifulSoup/JSON Scraper.
     */
    static async processScrapedData(payload) {
        // 1. Validate payload
        if (!payload.price || isNaN(payload.price)) {
            console.error("❌ Invalid price received from scraper.");
            return null;
        }
        // 2. Use the improved findProductByName (now handles insensitive and partial matches)
        const product = await price_provider_1.PriceProvider.findProductByName(payload.name);
        if (!product) {
            // Very important for your demo: logging missing mappings
            console.warn(`⚠️ No database mapping found for scraped item: "${payload.name}". Add this product to the dashboard to track it.`);
            return null;
        }
        // 3. Persist the official market price linked to the correct ID
        return await price_provider_1.PriceProvider.addMarketPrice({
            productId: product.id,
            price: payload.price,
            market: payload.market || "Central Market",
            source: "Official ECX Daily Scraper",
            unit: payload.unit || "kg"
        });
    }
}
exports.PriceService = PriceService;
