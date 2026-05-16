import { Router } from "express";
import { AssistantController } from "./assistant.controller";
import { authenticate, requireRole } from "../../middleware/authMiddleware";

const router = Router();


router.post("/chat", AssistantController.chat);


router.use(authenticate);


router.get("/insights", AssistantController.getFarmerInsights);

// Admin insights (optional - for admin dashboard)
router.get("/admin/insights", requireRole("ADMIN"), AssistantController.getAdminInsights);

// Chat history (optional - save user conversations)
router.get("/history", AssistantController.getChatHistory);
router.post("/history/save", AssistantController.saveChatMessage);

// Price forecast (optional - AI price prediction)
router.get("/forecast/:productId", AssistantController.getPriceForecast);

export default router;