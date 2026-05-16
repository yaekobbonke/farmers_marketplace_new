"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const assistant_controller_1 = require("./assistant.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.post("/chat", assistant_controller_1.AssistantController.chat);
router.use(authMiddleware_1.authenticate);
router.get("/insights", assistant_controller_1.AssistantController.getFarmerInsights);
// Admin insights (optional - for admin dashboard)
router.get("/admin/insights", (0, authMiddleware_1.requireRole)("ADMIN"), assistant_controller_1.AssistantController.getAdminInsights);
// Chat history (optional - save user conversations)
router.get("/history", assistant_controller_1.AssistantController.getChatHistory);
router.post("/history/save", assistant_controller_1.AssistantController.saveChatMessage);
// Price forecast (optional - AI price prediction)
router.get("/forecast/:productId", assistant_controller_1.AssistantController.getPriceForecast);
exports.default = router;
