import { Request, Response } from "express";
import { NotificationService } from "./notification.service";

export class NotificationController {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  getUserNotifications = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const notifications = await this.notificationService.getUserNotifications(userId);
      res.json({ success: true, data: notifications });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getUnreadCount = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const count = await this.notificationService.getUnreadCount(userId);
      res.json({ success: true, data: { count } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  markAsRead = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      await this.notificationService.markAsRead(id, userId);
      res.json({ success: true, message: "Notification marked as read" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  markAllAsRead = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      await this.notificationService.markAllAsRead(userId);
      res.json({ success: true, message: "All notifications marked as read" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  deleteNotification = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      await this.notificationService.deleteNotification(id, userId);
      res.json({ success: true, message: "Notification deleted" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}