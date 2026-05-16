import { Router } from "express";
import { NotificationController } from "./notification.controller";
import { authenticate } from "../../middleware/authMiddleware";

const router = Router();

// All routes require authentication
router.use(authenticate);

// Notification routes
router.get("/", NotificationController.getUserNotifications);
router.get("/unread-count", NotificationController.getUnreadCount);

router.put("/mark-all-read", NotificationController.markAllAsRead);
router.put("/:id/read", NotificationController.markAsRead);
router.delete("/:id", NotificationController.deleteNotification);

export default router;