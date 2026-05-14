import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { authMiddleware } from "../../middleware/authMiddleware";

const router = Router();
const notificationController = new NotificationController();

// All routes require authentication
router.use(authMiddleware);

// Notification routes
router.get("/", notificationController.getUserNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/:id/read", notificationController.markAsRead);
router.put("/mark-all-read", notificationController.markAllAsRead);
router.delete("/:id", notificationController.deleteNotification);

export default router;