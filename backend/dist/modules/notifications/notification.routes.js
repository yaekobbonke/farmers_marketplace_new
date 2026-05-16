"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notification_controller_1 = require("./notification.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(authMiddleware_1.authenticate);
// Notification routes
router.get("/", notification_controller_1.NotificationController.getUserNotifications);
router.get("/unread-count", notification_controller_1.NotificationController.getUnreadCount);
router.put("/mark-all-read", notification_controller_1.NotificationController.markAllAsRead);
router.put("/:id/read", notification_controller_1.NotificationController.markAsRead);
router.delete("/:id", notification_controller_1.NotificationController.deleteNotification);
exports.default = router;
