"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const dateUtils_1 = require("../../utils/dateUtils");
class AdminService {
    static async getStats() {
        const [totalUsers, totalProducts, totalOrders, totalRevenue] = await Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.product.count(),
            prisma_1.default.order.count(),
            prisma_1.default.order.aggregate({
                _sum: { totalAmount: true },
                where: { status: "COMPLETED" }
            })
        ]);
        // Get additional stats
        const [activeProducts, pendingProducts, completedOrders, pendingOrders, monthlyRevenue] = await Promise.all([
            prisma_1.default.product.count({ where: { status: "AVAILABLE" } }),
            prisma_1.default.product.count({ where: { is_verified: false } }),
            prisma_1.default.order.count({ where: { status: "COMPLETED" } }),
            prisma_1.default.order.count({ where: { status: "PENDING" } }),
            prisma_1.default.order.aggregate({
                _sum: { totalAmount: true },
                where: {
                    status: "COMPLETED",
                    createdAt: {
                        gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
                    }
                }
            })
        ]);
        // Calculate growth percentages (mock - you can implement actual calculations)
        const revenueChange = 12.5; // Example: 12.5% increase
        const userGrowth = 8.3;
        const orderGrowth = 15.2;
        const productGrowth = 5.7;
        return {
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue: totalRevenue._sum.totalAmount || 0,
            pendingProducts,
            activeProducts,
            completedOrders,
            pendingOrders,
            monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
            revenueChange,
            userGrowth,
            orderGrowth,
            productGrowth
        };
    }
    static async getAllUsers() {
        return prisma_1.default.user.findMany({
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                is_suspended: true,
                createdAt: true,
                _count: {
                    select: {
                        products: true,
                        orders: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    static async updateUserRole(userId, role) {
        // Prevent demoting the last admin
        if (role !== "ADMIN") {
            const adminCount = await prisma_1.default.user.count({
                where: { role: "ADMIN" }
            });
            const targetUser = await prisma_1.default.user.findUnique({
                where: { id: userId },
                select: { role: true }
            });
            if (targetUser?.role === "ADMIN" && adminCount === 1) {
                throw new Error("Cannot change role of the last admin");
            }
        }
        return prisma_1.default.user.update({
            where: { id: userId },
            data: { role: role },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                role: true,
                is_suspended: true,
                isActive: true
            }
        });
    }
    static async toggleSuspendUser(userId, isSuspended) {
        return prisma_1.default.user.update({
            where: { id: userId },
            data: {
                is_suspended: isSuspended,
                isActive: !isSuspended
            },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                is_suspended: true,
                isActive: true,
                role: true
            }
        });
    }
    static async suspendUser(userId) {
        return prisma_1.default.user.update({
            where: { id: userId },
            data: { is_suspended: true, isActive: false }
        });
    }
    static async unsuspendUser(userId) {
        return prisma_1.default.user.update({
            where: { id: userId },
            data: { is_suspended: false, isActive: true }
        });
    }
    static async deleteUser(userId) {
        // Prevent deleting the last admin
        const targetUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { role: true }
        });
        if (targetUser?.role === "ADMIN") {
            const adminCount = await prisma_1.default.user.count({
                where: { role: "ADMIN" }
            });
            if (adminCount === 1) {
                throw new Error("Cannot delete the last admin user");
            }
        }
        return prisma_1.default.user.delete({
            where: { id: userId },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                role: true
            }
        });
    }
    // ✅ Add getRecentActivity method
    static async getRecentActivity() {
        try {
            // Fetch recent users
            const recentUsers = await prisma_1.default.user.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    createdAt: true
                }
            });
            // Fetch recent products
            const recentProducts = await prisma_1.default.product.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    farmer: {
                        select: {
                            first_name: true,
                            last_name: true
                        }
                    }
                }
            });
            // Fetch recent orders
            const recentOrders = await prisma_1.default.order.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    buyer: {
                        select: {
                            first_name: true,
                            last_name: true
                        }
                    }
                }
            });
            // Combine and format activities
            const activity = [
                ...recentUsers.map(u => ({
                    id: u.id,
                    type: "user",
                    action: "New user registered",
                    user: `${u.first_name} ${u.last_name}`,
                    time: (0, dateUtils_1.formatTimeAgo)(u.createdAt),
                    timestamp: u.createdAt
                })),
                ...recentProducts.map(p => ({
                    id: p.id,
                    type: "product",
                    action: "New product listed",
                    user: p.farmer ? `${p.farmer.first_name} ${p.farmer.last_name}` : "Unknown farmer",
                    time: (0, dateUtils_1.formatTimeAgo)(p.createdAt),
                    timestamp: p.createdAt,
                    status: p.is_verified ? "verified" : "pending"
                })),
                ...recentOrders.map(o => ({
                    id: o.id,
                    type: "order",
                    action: `Order ${o.status.toLowerCase()}`,
                    user: o.buyer ? `${o.buyer.first_name} ${o.buyer.last_name}` : "Unknown buyer",
                    time: (0, dateUtils_1.formatTimeAgo)(o.createdAt),
                    timestamp: o.createdAt,
                    status: o.status.toLowerCase()
                }))
            ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
            return activity;
        }
        catch (error) {
            console.error("Error fetching recent activity:", error);
            throw new Error("Failed to fetch recent activity");
        }
    }
    // ✅ Add getSalesData method
    static async getSalesData(range = "month") {
        try {
            const days = range === "week" ? 7 : range === "year" ? 365 : 30;
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            startDate.setHours(0, 0, 0, 0);
            // Fetch all completed orders within the date range
            const orders = await prisma_1.default.order.findMany({
                where: {
                    createdAt: { gte: startDate },
                    status: "COMPLETED"
                },
                select: {
                    createdAt: true,
                    totalAmount: true,
                    id: true
                },
                orderBy: { createdAt: 'asc' }
            });
            // Group orders by date
            const ordersByDate = new Map();
            // Initialize all dates in range
            for (let i = 0; i < days; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const dateKey = date.toISOString().split('T')[0];
                ordersByDate.set(dateKey, { orders: 0, revenue: 0 });
            }
            // Aggregate orders by date
            orders.forEach(order => {
                const dateKey = order.createdAt.toISOString().split('T')[0];
                const existing = ordersByDate.get(dateKey);
                if (existing) {
                    existing.orders += 1;
                    existing.revenue += Number(order.totalAmount);
                    ordersByDate.set(dateKey, existing);
                }
            });
            // Format sales data for response
            const salesData = [];
            for (let i = 0; i < days; i++) {
                const date = new Date(startDate);
                date.setDate(date.getDate() + i);
                const dateKey = date.toISOString().split('T')[0];
                const data = ordersByDate.get(dateKey) || { orders: 0, revenue: 0 };
                let formattedDate;
                if (range === "year") {
                    formattedDate = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                }
                else if (range === "week") {
                    formattedDate = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                }
                else {
                    formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
                salesData.push({
                    date: formattedDate,
                    dateKey: dateKey,
                    orders: data.orders,
                    revenue: data.revenue
                });
            }
            // Calculate summary statistics
            const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
            const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
            const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
            const peakDay = salesData.reduce((max, d) => d.revenue > max.revenue ? d : max, salesData[0]);
            return {
                data: salesData,
                summary: {
                    totalOrders,
                    totalRevenue,
                    averageOrderValue,
                    peakDay: {
                        date: peakDay.date,
                        revenue: peakDay.revenue,
                        orders: peakDay.orders
                    },
                    period: {
                        start: startDate.toISOString().split('T')[0],
                        end: new Date().toISOString().split('T')[0],
                        range
                    }
                }
            };
        }
        catch (error) {
            console.error("Error fetching sales data:", error);
            throw new Error("Failed to fetch sales data");
        }
    }
    // Get all products with farmer details
    static async getAllProducts() {
        return prisma_1.default.product.findMany({
            include: {
                farmer: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                        phone: true,
                        location: true
                    }
                },
                category: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    // ✅ Verify a product
    static async verifyProduct(productId) {
        return prisma_1.default.product.update({
            where: { id: productId },
            data: { is_verified: true },
            include: {
                farmer: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true
                    }
                }
            }
        });
    }
    // ✅ Feature a product (add to featured list)
    static async featureProduct(productId) {
        // You may need to add a 'is_featured' field to your Product model
        // For now, we can add a 'featured' tag
        const product = await prisma_1.default.product.findUnique({
            where: { id: productId }
        });
        const currentTags = product?.tags || "";
        const hasFeatured = currentTags.includes("featured");
        const newTags = hasFeatured
            ? currentTags.replace("featured", "").replace(/,,/g, ",").replace(/^,|,$/g, "")
            : currentTags ? `${currentTags},featured` : "featured";
        return prisma_1.default.product.update({
            where: { id: productId },
            data: { tags: newTags || null }
        });
    }
    // ✅ Delete a product
    static async deleteProduct(productId) {
        return prisma_1.default.product.delete({
            where: { id: productId }
        });
    }
}
exports.AdminService = AdminService;
