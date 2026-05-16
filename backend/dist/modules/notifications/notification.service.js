"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
class NotificationService {
    static async getUserNotifications(userId) {
        return prisma_1.default.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" }
        });
    }
    static async getUnreadCount(userId) {
        return prisma_1.default.notification.count({
            where: { userId, isRead: false }
        });
    }
    static async markAsRead(notificationId, userId) {
        return prisma_1.default.notification.updateMany({
            where: {
                id: notificationId,
                userId
            },
            data: { isRead: true }
        });
    }
    static async markAllAsRead(userId) {
        return prisma_1.default.notification.updateMany({
            where: {
                userId,
                isRead: false
            },
            data: { isRead: true }
        });
    }
    static async deleteNotification(notificationId, userId) {
        return prisma_1.default.notification.deleteMany({
            where: {
                id: notificationId,
                userId
            }
        });
    }
    static async createNotification(data) {
        return prisma_1.default.notification.create({
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
exports.NotificationService = NotificationService;
