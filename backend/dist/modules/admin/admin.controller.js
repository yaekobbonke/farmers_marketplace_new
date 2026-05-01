"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
class AdminController {
    /**
     * GET /api/admin/stats
     * Get system statistics (user count, product count, revenue)
     */
    static async getSystemStats(req, res) {
        try {
            const stats = await admin_service_1.AdminService.getSystemStats();
            return res.status(200).json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            console.error("Error fetching system stats:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch system statistics"
            });
        }
    }
    /**
     * GET /api/admin/products/pending
     * Get all products awaiting verification
     */
    static async getPendingProducts(req, res) {
        try {
            const products = await admin_service_1.AdminService.getPendingProducts();
            return res.status(200).json({
                success: true,
                data: products,
                count: products.length
            });
        }
        catch (error) {
            console.error("Error fetching pending products:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch pending products"
            });
        }
    }
    /**
     * PUT /api/admin/products/:id/verify
     * Verify a product (approve it for marketplace)
     */
    static async verifyProduct(req, res) {
        try {
            const productId = parseInt(req.params.id);
            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product ID"
                });
            }
            const product = await admin_service_1.AdminService.verifyProduct(productId);
            return res.status(200).json({
                success: true,
                message: "Product verified successfully",
                data: product
            });
        }
        catch (error) {
            console.error("Error verifying product:", error);
            if (error.message?.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    message: "Product not found"
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to verify product"
            });
        }
    }
    /**
     * PATCH /api/admin/users/:id/suspend
     * Toggle user suspension status
     */
    static async toggleUserStatus(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const { isSuspended } = req.body;
            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID"
                });
            }
            if (typeof isSuspended !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: "isSuspended must be a boolean value"
                });
            }
            const user = await admin_service_1.AdminService.toggleUserStatus(userId, isSuspended);
            return res.status(200).json({
                success: true,
                message: `User ${isSuspended ? 'suspended' : 'activated'} successfully`,
                data: user
            });
        }
        catch (error) {
            console.error("Error toggling user status:", error);
            if (error.message?.includes("not found")) {
                return res.status(404).json({
                    success: false,
                    message: "User not found"
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to update user status"
            });
        }
    }
    /**
     * GET /api/admin/users
     * Get all users with their activity counts
     */
    static async getAllUsers(req, res) {
        try {
            const users = await admin_service_1.AdminService.getAllUsers();
            return res.status(200).json({
                success: true,
                data: users,
                count: users.length
            });
        }
        catch (error) {
            console.error("Error fetching users:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch users"
            });
        }
    }
    /**
     * DELETE /api/admin/products/:id
     * Delete a single product
     */
    static async deleteProduct(req, res) {
        try {
            const productId = parseInt(req.params.id);
            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product ID. Please provide a valid number."
                });
            }
            const result = await admin_service_1.AdminService.deleteProduct(productId);
            return res.status(200).json(result);
        }
        catch (error) {
            console.error("Delete product error:", error);
            if (error.message === "Product not found") {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to delete product"
            });
        }
    }
    /**
     * DELETE /api/admin/users/:id
     * Delete a single user (soft delete by default, use ?hard=true for permanent)
     */
    static async deleteUser(req, res) {
        try {
            const userId = parseInt(req.params.id);
            const hardDelete = req.query.hard === 'true';
            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID. Please provide a valid number."
                });
            }
            const result = await admin_service_1.AdminService.deleteUser(userId, hardDelete);
            return res.status(200).json(result);
        }
        catch (error) {
            console.error("Delete user error:", error);
            if (error.message === "User not found") {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            if (error.message.includes("Cannot delete")) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to delete user"
            });
        }
    }
    /**
     * POST /api/admin/products/bulk-delete
     * Delete multiple products at once
     * Body: { productIds: [1, 2, 3] }
     */
    static async bulkDeleteProducts(req, res) {
        try {
            const { productIds } = req.body;
            if (!productIds) {
                return res.status(400).json({
                    success: false,
                    message: "Missing productIds in request body"
                });
            }
            if (!Array.isArray(productIds)) {
                return res.status(400).json({
                    success: false,
                    message: "productIds must be an array of numbers"
                });
            }
            if (productIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "productIds array cannot be empty"
                });
            }
            // Validate all IDs are numbers
            const validIds = productIds.every(id => typeof id === 'number' && !isNaN(id));
            if (!validIds) {
                return res.status(400).json({
                    success: false,
                    message: "All product IDs must be valid numbers"
                });
            }
            const result = await admin_service_1.AdminService.bulkDeleteProducts(productIds);
            return res.status(200).json(result);
        }
        catch (error) {
            console.error("Bulk delete products error:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to delete products"
            });
        }
    }
    /**
     * POST /api/admin/users/bulk-delete
     * Delete multiple users at once
     * Body: { userIds: [1, 2, 3], hardDelete: false }
     */
    static async bulkDeleteUsers(req, res) {
        try {
            const { userIds, hardDelete = false } = req.body;
            if (!userIds) {
                return res.status(400).json({
                    success: false,
                    message: "Missing userIds in request body"
                });
            }
            if (!Array.isArray(userIds)) {
                return res.status(400).json({
                    success: false,
                    message: "userIds must be an array of numbers"
                });
            }
            if (userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "userIds array cannot be empty"
                });
            }
            // Validate all IDs are numbers
            const validIds = userIds.every(id => typeof id === 'number' && !isNaN(id));
            if (!validIds) {
                return res.status(400).json({
                    success: false,
                    message: "All user IDs must be valid numbers"
                });
            }
            const result = await admin_service_1.AdminService.bulkDeleteUsers(userIds, hardDelete);
            return res.status(200).json(result);
        }
        catch (error) {
            console.error("Bulk delete users error:", error);
            if (error.message.includes("Cannot delete all admin users")) {
                return res.status(403).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to delete users"
            });
        }
    }
    /**
     * GET /api/admin/users/:id
     * Get a single user by ID with full details
     */
    static async getUserById(req, res) {
        try {
            const userId = parseInt(req.params.id);
            if (isNaN(userId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid user ID"
                });
            }
            // ✅ Call AdminService instead of using prisma directly
            const user = await admin_service_1.AdminService.getUserById(userId);
            return res.status(200).json({
                success: true,
                data: user
            });
        }
        catch (error) {
            console.error("Error fetching user:", error);
            if (error.message === "User not found") {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch user"
            });
        }
    }
    /**
     * GET /api/admin/products/:id
     * Get a single product by ID with full details
     */
    static async getProductById(req, res) {
        try {
            const productId = parseInt(req.params.id);
            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product ID"
                });
            }
            // ✅ Call AdminService instead of using prisma directly
            const product = await admin_service_1.AdminService.getProductById(productId);
            return res.status(200).json({
                success: true,
                data: product
            });
        }
        catch (error) {
            console.error("Error fetching product:", error);
            if (error.message === "Product not found") {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch product"
            });
        }
    }
}
exports.AdminController = AdminController;
