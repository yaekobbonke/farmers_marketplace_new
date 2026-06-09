// backend/src/modules/prices/price.routes.ts
import { PriceController } from "./price.controller";
import { Router } from "express";
import { authenticate } from "../../middleware/authMiddleware";

const router = Router();

router.use(authenticate); // Ensure all price routes require authentication

router.get('/latest', PriceController.getLatestPrices);
router.get('/:id/predict', PriceController.getPrediction);
router.post('/internal/sync', PriceController.syncScrapedData);

export default router;