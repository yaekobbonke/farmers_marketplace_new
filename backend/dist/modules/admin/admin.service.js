"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
class AdminService {
    /**
     * Get system statistics (user count, product count, revenue)
     */
    static async getSystemStats() {
        const [userCount, productCount, totalRevenue] = await Promise.all([
            prisma_1.default.user.count(),
            prisma_1.default.product.count(),
            prisma_1.default.order.aggregate({
                _sum: { totalAmount: true },
            }),
        ]);
        return {
            userCount,
            productCount,
            revenue: totalRevenue._sum?.totalAmount || 0,
        };
    }
    /**
     * Get all products awaiting verification
     */
    static async getPendingProducts() {
        return prisma_1.default.product.findMany({
            where: { is_verified: false },
            include: {
                farmer: {
                    select: {
                        first_name: true,
                        last_name: true,
                        email: true
                    }
                }
            },
            orderBy: { createdAt: "desc" },
        });
    }
    /**
     * Verify a product (approve it for marketplace)
     */
    static async verifyProduct(id) {
        const product = await prisma_1.default.product.findUnique({
            where: { id }
        });
        if (!product) {
            throw new Error("Product not found");
        }
        return prisma_1.default.product.update({
            where: { id },
            data: { is_verified: true },
        });
    }
    /**
     * Toggle user suspension status
     */
    static async toggleUserStatus(id, isSuspended) {
        const user = await prisma_1.default.user.findUnique({
            where: { id }
        });
        if (!user) {
            throw new Error("User not found");
        }
        return prisma_1.default.user.update({
            where: { id },
            data: { is_suspended: isSuspended },
        });
    }
    /**
     * Get all users with their activity counts
     */
    static async getAllUsers() {
        return prisma_1.default.user.findMany({
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                role: true,
                is_suspended: true,
                createdAt: true,
                _count: {
                    select: { products: true, orders: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
    /**
     * Delete a single product
     */
    static async deleteProduct(productId) {
        try {
            // Check if product exists
            const product = await prisma_1.default.product.findUnique({
                where: { id: productId },
                include: {
                    farmer: {
                        select: {
                            id: true,
                            first_name: true,
                            last_name: true,
                            email: true
                        }
                    }
                }
            });
            if (!product) {
                throw new Error("Product not found");
            }
            // Delete the product
            const deletedProduct = await prisma_1.default.product.delete({
                where: { id: productId }
            });
            return {
                success: true,
                message: `Product "${product.name}" has been deleted successfully`,
                data: {
                    id: deletedProduct.id,
                    name: deletedProduct.name,
                    price: deletedProduct.price,
                    farmer: product.farmer,
                    deletedAt: new Date().toISOString()
                }
            };
        }
        catch (error) {
            console.error("Error deleting product:", error);
            if (error.code === "P2003") {
                throw new Error("Cannot delete product because it has existing orders. Consider marking as inactive instead.");
            }
            throw new Error(error.message || "Failed to delete product");
        }
    }
    /**
     * Delete a single user (soft delete by default, use hardDelete for permanent)
     */
    static async deleteUser(userId, hardDelete = false) {
        try {
            // Check if user exists
            const user = await prisma_1.default.user.findUnique({
                where: { id: userId },
                include: {
                    _count: {
                        select: { products: true, orders: true }
                    }
                }
            });
            if (!user) {
                throw new Error("User not found");
            }
            // Prevent deleting the last admin
            if (user.role === "ADMIN") {
                const adminCount = await prisma_1.default.user.count({
                    where: { role: "ADMIN" }
                });
                if (adminCount === 1) {
                    throw new Error("Cannot delete the only admin user");
                }
            }
            let result;
            if (hardDelete) {
                // Hard delete: Remove user and all related data
                result = await prisma_1.default.user.delete({
                    where: { id: userId }
                });
                return {
                    success: true,
                    message: `User "${user.email}" has been permanently deleted`,
                    data: {
                        ...result,
                        deletedProducts: user._count.products,
                        deletedOrders: user._count.orders
                    }
                };
            }
            else {
                // Soft delete: Just mark as suspended
                result = await prisma_1.default.user.update({
                    where: { id: userId },
                    data: { is_suspended: true }
                });
                return {
                    success: true,
                    message: `User "${user.email}" has been suspended`,
                    data: result
                };
            }
        }
        catch (error) {
            console.error("Error deleting user:", error);
            throw new Error(error.message || "Failed to delete user");
        }
    }
    /**
     * Delete multiple products at once
     */
    static async bulkDeleteProducts(productIds) {
        try {
            // First, check which products exist
            const existingProducts = await prisma_1.default.product.findMany({
                where: {
                    id: { in: productIds }
                },
                select: {
                    id: true,
                    name: true
                }
            });
            const existingIds = existingProducts.map(p => p.id);
            const missingIds = productIds.filter(id => !existingIds.includes(id));
            if (existingIds.length === 0) {
                throw new Error("No valid products found to delete");
            }
            // Delete existing products
            const deleted = await prisma_1.default.product.deleteMany({
                where: {
                    id: { in: existingIds }
                }
            });
            return {
                success: true,
                message: `${deleted.count} product(s) deleted successfully`,
                data: {
                    deletedCount: deleted.count,
                    deletedProducts: existingProducts,
                    missingIds: missingIds,
                    missingCount: missingIds.length
                }
            };
        }
        catch (error) {
            console.error("Error bulk deleting products:", error);
            throw new Error(error.message || "Failed to delete products");
        }
    }
    /**
     * Delete multiple users at once
     */
    static async bulkDeleteUsers(userIds, hardDelete = false) {
        try {
            // Prevent deleting all admins
            const adminUsers = await prisma_1.default.user.findMany({
                where: {
                    id: { in: userIds },
                    role: "ADMIN"
                }
            });
            const adminCount = await prisma_1.default.user.count({ where: { role: "ADMIN" } });
            if (adminUsers.length === adminCount && adminCount > 0) {
                throw new Error("Cannot delete all admin users");
            }
            let deleted;
            if (hardDelete) {
                deleted = await prisma_1.default.user.deleteMany({
                    where: {
                        id: { in: userIds }
                    }
                });
            }
            else {
                deleted = await prisma_1.default.user.updateMany({
                    where: {
                        id: { in: userIds }
                    },
                    data: { is_suspended: true }
                });
            }
            return {
                success: true,
                message: `${deleted.count} user(s) processed successfully`,
                count: deleted.count
            };
        }
        catch (error) {
            console.error("Error bulk deleting users:", error);
            throw new Error(error.message || "Failed to delete users");
        }
    }
    /**
     * Get a single user by ID with full details
     */
    static async getUserById(userId) {
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                role: true,
                is_suspended: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: {
                        products: true,
                        orders: true
                    }
                }
            }
        });
        if (!user) {
            throw new Error("User not found");
        }
        return user;
    }
    /**
     * Get a single product by ID with full details including farmer info
     */
    static async getProductById(productId) {
        const product = await prisma_1.default.product.findUnique({
            where: { id: productId },
            include: {
                farmer: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true
                    }
                },
                _count: {
                    select: {
                        cartItems: true,
                        orderItems: true
                    }
                }
            }
        });
        if (!product) {
            throw new Error("Product not found");
        }
        return product;
    }
}
exports.AdminService = AdminService;
