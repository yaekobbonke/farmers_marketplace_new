import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class NotificationService {
  async getUserNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async getUnreadCount(userId: string) {
    return prisma.notification.count({
      where: { userId, isRead: false }
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { 
        id: notificationId,
        userId 
      },
      data: { isRead: true }
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { 
        userId, 
        isRead: false 
      },
      data: { isRead: true }
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    return prisma.notification.deleteMany({
      where: { 
        id: notificationId,
        userId 
      }
    });
  }

  async createNotification(data: {
    userId: string;
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