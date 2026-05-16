// backend/src/modules/prices/price.routes.ts
import { PriceController } from "./price.controller";
import { Router } from "express";

const router = Router();


router.get('/latest', PriceController.getLatestPrices);

router.get('/:id/predict', PriceController.getPrediction);
router.post('/internal/sync', PriceController.syncScrapedData);

export default router;