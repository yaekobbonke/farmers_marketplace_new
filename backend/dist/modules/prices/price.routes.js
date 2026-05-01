"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/module/price/price.route.ts
const price_controller_1 = require("./price.controller");
const express_1 = require("express");
const router = (0, express_1.Router)();
// 1. The Llama 3 Context Feed (New)
// FastAPI calls this to get real-time price snapshots for the chatbot
router.get('/latest', price_controller_1.PriceController.getLatestPrices);
// 2. The XGBoost Trigger
// The frontend calls this to get a specific 7-day forecast
router.get('/:id/predict', price_controller_1.PriceController.getPrediction);
// 3. The Scraper Input
// The Python BeautifulSoup scraper calls this to push new data
router.post('/internal/sync', price_controller_1.PriceController.syncScrapedData);
exports.default = router;
