"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminSettingsController = void 0;
const admin_settings_service_1 = require("./admin.settings.service");
class AdminSettingsController {
    static async getSettings(req, res) {
        try {
            const settings = await admin_settings_service_1.AdminSettingsService.getSettings();
            res.json({ success: true, data: settings });
        }
        catch (error) {
            console.error("Error fetching settings:", error);
            // Handle specific error types
            if (error.code === 'P2021') {
                // Table doesn't exist yet
                return res.status(200).json({
                    success: true,
                    data: null,
                    message: "Settings not initialized yet"
                });
            }
            res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch settings"
            });
        }
    }
    static async updateSettings(req, res) {
        try {
            // Validate request body
            if (!req.body || Object.keys(req.body).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "No settings data provided"
                });
            }
            const settings = await admin_settings_service_1.AdminSettingsService.updateSettings(req.body);
            res.json({
                success: true,
                data: settings,
                message: "Settings updated successfully"
            });
        }
        catch (error) {
            console.error("Error updating settings:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to update settings"
            });
        }
    }
    static async clearCache(req, res) {
        try {
            await admin_settings_service_1.AdminSettingsService.clearCache();
            res.json({
                success: true,
                message: "Cache cleared successfully"
            });
        }
        catch (error) {
            console.error("Error clearing cache:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to clear cache"
            });
        }
    }
    static async seedSettings(req, res) {
        try {
            // Optional: Add authentication check for seeding
            const apiKey = req.headers['x-api-key'];
            if (apiKey !== process.env.ADMIN_API_KEY) {
                return res.status(401).json({
                    success: false,
                    message: "Unauthorized: Invalid API key"
                });
            }
            await admin_settings_service_1.AdminSettingsService.seedDefaultSettings();
            res.json({
                success: true,
                message: "Default settings seeded successfully"
            });
        }
        catch (error) {
            console.error("Error seeding settings:", error);
            res.status(500).json({
                success: false,
                message: error.message || "Failed to seed settings"
            });
        }
    }
}
exports.AdminSettingsController = AdminSettingsController;
