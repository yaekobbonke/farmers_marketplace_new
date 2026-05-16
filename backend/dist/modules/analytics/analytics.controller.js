"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const analytics_service_1 = require("./analytics.service");
class AnalyticsController {
    static async getFarmerOverview(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const overview = await analytics_service_1.AnalyticsService.getFarmerOverview(userId);
            res.json({ success: true, data: overview });
        }
        catch (error) {
            console.error("Error fetching farmer overview:", error.message);
            res.status(500).json({ success: false, message: error.message || "Failed to fetch farmer overview" });
        }
    }
    static async getFarmerProductAnalytics(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const { period = "week" } = req.query;
            // Validate period
            if (!["week", "month", "year"].includes(period)) {
                return res.status(400).json({ success: false, message: "Invalid period. Use week, month, or year" });
            }
            const analytics = await analytics_service_1.AnalyticsService.getFarmerProductAnalytics(userId, period);
            res.json({ success: true, data: analytics });
        }
        catch (error) {
            console.error("Error fetching product analytics:", error.message);
            res.status(500).json({ success: false, message: error.message || "Failed to fetch product analytics" });
        }
    }
    static async getFarmerSalesAnalytics(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const { period = "month" } = req.query;
            // Validate period
            if (!["week", "month", "year"].includes(period)) {
                return res.status(400).json({ success: false, message: "Invalid period. Use week, month, or year" });
            }
            const analytics = await analytics_service_1.AnalyticsService.getFarmerSalesAnalytics(userId, period);
            res.json({ success: true, data: analytics });
        }
        catch (error) {
            console.error("Error fetching sales analytics:", error.message);
            res.status(500).json({ success: false, message: error.message || "Failed to fetch sales analytics" });
        }
    }
    static async getFarmerViewsAnalytics(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const analytics = await analytics_service_1.AnalyticsService.getFarmerViewsAnalytics(userId);
            res.json({ success: true, data: analytics });
        }
        catch (error) {
            console.error("Error fetching views analytics:", error.message);
            res.status(500).json({ success: false, message: error.message || "Failed to fetch views analytics" });
        }
    }
    static async getAdminOverview(req, res) {
        try {
            // Check admin role
            if (req.user?.role !== "ADMIN") {
                return res.status(403).json({ success: false, message: "Admin access required" });
            }
            const overview = await analytics_service_1.AnalyticsService.getAdminOverview();
            res.json({ success: true, data: overview });
        }
        catch (error) {
            console.error("Error fetching admin overview:", error.message);
            res.status(500).json({ success: false, message: error.message || "Failed to fetch admin overview" });
        }
    }
    static async getAdminProductAnalytics(req, res) {
        try {
            if (req.user?.role !== "ADMIN") {
                return res.status(403).json({ success: false, message: "Admin access required" });
            }
            const analytics = await analytics_service_1.AnalyticsService.getAdminProductAnalytics();
            res.json({ success: true, data: analytics });
        }
        catch (error) {
            console.error("Error fetching admin product analytics:", error.message);
            res.status(500).json({ success: false, message: error.message || "Failed to fetch product analytics" });
        }
    }
    static async getAdminUserAnalytics(req, res) {
        try {
            if (req.user?.role !== "ADMIN") {
                return res.status(403).json({ success: false, message: "Admin access required" });
            }
            const analytics = await analytics_service_1.AnalyticsService.getAdminUserAnalytics();
            res.json({ success: true, data: analytics });
        }
        catch (error) {
            console.error("Error fetching admin user analytics:", error.message);
            res.status(500).json({ success: false, message: error.message || "Failed to fetch user analytics" });
        }
    }
}
exports.AnalyticsController = AnalyticsController;
