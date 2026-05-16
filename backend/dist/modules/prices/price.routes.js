"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// backend/src/modules/prices/price.routes.ts
const price_controller_1 = require("./price.controller");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get('/latest', price_controller_1.PriceController.getLatestPrices);
router.get('/:id/predict', price_controller_1.PriceController.getPrediction);
router.post('/internal/sync', price_controller_1.PriceController.syncScrapedData);
exports.default = router;
