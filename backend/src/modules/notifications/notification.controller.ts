import { Request, Response } from "express";
import { NotificationService } from "./notification.service";

export class NotificationController {
  
  // No need for constructor since we're using static methods

  static getUserNotifications = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }
      
      const notifications = await NotificationService.getUserNotifications(userId);
      res.json({ success: true, data: notifications });
    } catch (error: any) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getUnreadCount = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }
      
      const count = await NotificationService.getUnreadCount(userId);
      res.json({ success: true, data: { count } });
    } catch (error: any) {
      console.error("Error getting unread count:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static markAsRead = async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ success: false, message: "Invalid notification ID" });
      }
      if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }
      
      await NotificationService.markAsRead(notificationId, userId);
      res.json({ success: true, message: "Notification marked as read" });
    } catch (error: any) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static markAllAsRead = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }
      
      await NotificationService.markAllAsRead(userId);
      res.json({ success: true, message: "All notifications marked as read" });
    } catch (error: any) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static deleteNotification = async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user?.id;
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ success: false, message: "Invalid notification ID" });
      }
      if (!userId) {
        return res.status(401).json({ success: false, message: "User not authenticated" });
      }
      
      await NotificationService.deleteNotification(notificationId, userId);
      res.json({ success: true, message: "Notification deleted" });
    } catch (error: any) {
      console.error("Error deleting notification:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  };
}