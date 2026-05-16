"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
const product_service_1 = require("../products/product.service");
class AdminController {
    static async getStats(req, res) {
        try {
            const stats = await admin_service_1.AdminService.getStats();
            res.json({ success: true, data: stats });
        }
        catch (error) {
            console.error("Error fetching stats:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getAllUsers(req, res) {
        try {
            const users = await admin_service_1.AdminService.getAllUsers();
            res.json({ success: true, data: users });
        }
        catch (error) {
            console.error("Error fetching users:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async updateUserRole(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const { role } = req.body;
            if (!role || !["ADMIN", "FARMER", "BUYER"].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid role. Must be ADMIN, FARMER, or BUYER"
                });
            }
            const updated = await admin_service_1.AdminService.updateUserRole(userId, role);
            res.json({
                success: true,
                data: updated,
                message: `User role updated to ${role} successfully`
            });
        }
        catch (error) {
            console.error("❌ Update role error:", error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async toggleSuspendUser(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const { isSuspended } = req.body;
            if (isSuspended === undefined) {
                return res.status(400).json({
                    success: false,
                    message: "isSuspended field is required"
                });
            }
            const updated = await admin_service_1.AdminService.toggleSuspendUser(userId, isSuspended);
            res.json({
                success: true,
                data: updated,
                message: isSuspended ? "User suspended successfully" : "User unsuspended successfully"
            });
        }
        catch (error) {
            console.error("Error toggling user suspension:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async suspendUser(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const updated = await admin_service_1.AdminService.suspendUser(userId);
            res.json({ success: true, data: updated, message: "User suspended successfully" });
        }
        catch (error) {
            console.error("Error suspending user:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async unsuspendUser(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const updated = await admin_service_1.AdminService.unsuspendUser(userId);
            res.json({ success: true, data: updated, message: "User unsuspended successfully" });
        }
        catch (error) {
            console.error("Error unsuspending user:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async deleteUser(req, res) {
        try {
            const userId = parseInt(req.params.userId);
            const currentAdminId = req.user?.id;
            if (currentAdminId === userId) {
                return res.status(400).json({
                    success: false,
                    message: "You cannot delete your own account. Use account settings instead."
                });
            }
            const deleted = await admin_service_1.AdminService.deleteUser(userId);
            res.json({
                success: true,
                data: deleted,
                message: `User ${deleted.first_name} ${deleted.last_name} has been deleted successfully`
            });
        }
        catch (error) {
            console.error("❌ Delete user error:", error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getRecentActivity(req, res) {
        try {
            const activity = await admin_service_1.AdminService.getRecentActivity();
            res.json({ success: true, data: activity });
        }
        catch (error) {
            console.error("❌ Error fetching recent activity:", error.message);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    static async getSalesData(req, res) {
        try {
            const { range } = req.query;
            const validRange = range === "week" || range === "year" ? range : "month";
            const salesData = await admin_service_1.AdminService.getSalesData(validRange);
            res.json({
                success: true,
                data: salesData.data,
                summary: salesData.summary
            });
        }
        catch (error) {
            console.error("❌ Error fetching sales data:", error.message);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch sales data"
            });
        }
    }
    // Get all products for admin - This stays with AdminService
    static async getAllProducts(req, res) {
        try {
            const products = await admin_service_1.AdminService.getAllProducts();
            res.json({ success: true, data: products });
        }
        catch (error) {
            console.error("Error fetching products:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Verify a product - Using ProductService (has duplicate prevention)
    static async verifyProduct(req, res) {
        try {
            const productId = parseInt(req.params.productId);
            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product ID"
                });
            }
            console.log(`🔍 Admin verifying product: ${productId}`);
            const product = await product_service_1.ProductService.verifyProduct(productId);
            res.json({
                success: true,
                data: product,
                message: "Product verified successfully. Farmer has been notified."
            });
        }
        catch (error) {
            console.error("Error verifying product:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Feature a product - Using ProductService (has duplicate prevention)
    static async featureProduct(req, res) {
        try {
            const productId = parseInt(req.params.productId);
            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product ID"
                });
            }
            console.log(`🌟 Admin featuring product: ${productId}`);
            const product = await product_service_1.ProductService.featureProduct(productId);
            res.json({
                success: true,
                data: product,
                message: "Product featured successfully. Farmer has been notified."
            });
        }
        catch (error) {
            console.error("Error featuring product:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
    // ✅ Delete a product - Using ProductService (has duplicate prevention)
    static async deleteProduct(req, res) {
        try {
            const productId = parseInt(req.params.productId);
            const adminId = req.user?.id;
            if (isNaN(productId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid product ID"
                });
            }
            console.log(`🗑️ Admin deleting product: ${productId}`);
            await product_service_1.ProductService.remove(productId, adminId, "ADMIN");
            res.json({
                success: true,
                message: "Product deleted successfully. Farmer has been notified."
            });
        }
        catch (error) {
            console.error("Error deleting product:", error);
            res.status(500).json({ success: false, message: error.message });
        }
    }
}
exports.AdminController = AdminController;
