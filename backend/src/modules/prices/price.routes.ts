// backend/src/module/price/price.route.ts
import { PriceController } from "./price.controller";
import { Router } from "express";

const router = Router();

// 1. The Llama 3 Context Feed (New)
// FastAPI calls this to get real-time price snapshots for the chatbot
router.get('/latest', PriceController.getLatestPrices);

// 2. The XGBoost Trigger
// The frontend calls this to get a specific 7-day forecast
router.get('/:id/predict', PriceController.getPrediction);

// 3. The Scraper Input
// The Python BeautifulSoup scraper calls this to push new data
router.post('/internal/sync', PriceController.syncScrapedData);

export default router;