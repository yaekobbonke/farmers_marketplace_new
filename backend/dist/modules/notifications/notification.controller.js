"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
class NotificationController {
}
exports.NotificationController = NotificationController;
_a = NotificationController;
// No need for constructor since we're using static methods
NotificationController.getUserNotifications = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }
        const notifications = await notification_service_1.NotificationService.getUserNotifications(userId);
        res.json({ success: true, data: notifications });
    }
    catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
NotificationController.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }
        const count = await notification_service_1.NotificationService.getUnreadCount(userId);
        res.json({ success: true, data: { count } });
    }
    catch (error) {
        console.error("Error getting unread count:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
NotificationController.markAsRead = async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);
        const userId = req.user?.id;
        if (isNaN(notificationId)) {
            return res.status(400).json({ success: false, message: "Invalid notification ID" });
        }
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }
        await notification_service_1.NotificationService.markAsRead(notificationId, userId);
        res.json({ success: true, message: "Notification marked as read" });
    }
    catch (error) {
        console.error("Error marking notification as read:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
NotificationController.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }
        await notification_service_1.NotificationService.markAllAsRead(userId);
        res.json({ success: true, message: "All notifications marked as read" });
    }
    catch (error) {
        console.error("Error marking all notifications as read:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
NotificationController.deleteNotification = async (req, res) => {
    try {
        const notificationId = parseInt(req.params.id);
        const userId = req.user?.id;
        if (isNaN(notificationId)) {
            return res.status(400).json({ success: false, message: "Invalid notification ID" });
        }
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }
        await notification_service_1.NotificationService.deleteNotification(notificationId, userId);
        res.json({ success: true, message: "Notification deleted" });
    }
    catch (error) {
        console.error("Error deleting notification:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
