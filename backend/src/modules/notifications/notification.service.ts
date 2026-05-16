import prisma from "../../config/prisma";

export class NotificationService {
  static async getUserNotifications(userId: number) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  static async getUnreadCount(userId: number) {
    return prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  static async markAsRead(notificationId: number, userId: number) {
    return prisma.notification.updateMany({
      where: { 
        id: notificationId,
        userId 
      },
      data: { isRead: true }
    });
  }

  static async markAllAsRead(userId: number) {
    return prisma.notification.updateMany({
      where: { 
        userId, 
        isRead: false 
      },
      data: { isRead: true }
    });
  }

  static async deleteNotification(notificationId: number, userId: number) {
    return prisma.notification.deleteMany({
      where: { 
        id: notificationId,
        userId 
      }
    });
  }

  static async createNotification(data: {
    userId: number;
    title: string;
    message: string;
    type?: string;
  }) {
    return prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || "general",
        isRead: false
      }
    });
  }
}