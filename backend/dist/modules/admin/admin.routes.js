"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const admin_settings_controller_1 = require("./admin.settings.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// All admin routes require authentication and admin role
router.use(authMiddleware_1.authenticate);
router.use((0, authMiddleware_1.requireRole)("ADMIN"));
// Dashboard stats
router.get("/stats", admin_controller_1.AdminController.getStats);
router.get("/recent-activity", admin_controller_1.AdminController.getRecentActivity);
router.get("/sales-data", admin_controller_1.AdminController.getSalesData);
// User management
router.get("/users", admin_controller_1.AdminController.getAllUsers);
router.put("/users/:userId/role", admin_controller_1.AdminController.updateUserRole);
router.patch("/users/:userId/suspend", admin_controller_1.AdminController.toggleSuspendUser);
router.delete("/users/:userId", admin_controller_1.AdminController.deleteUser);
// ✅ Product management routes
router.get("/products", admin_controller_1.AdminController.getAllProducts);
router.patch("/products/:productId/verify", admin_controller_1.AdminController.verifyProduct);
router.patch("/products/:productId/feature", admin_controller_1.AdminController.featureProduct);
router.delete("/products/:productId", admin_controller_1.AdminController.deleteProduct);
// Settings routes
router.get("/settings", admin_settings_controller_1.AdminSettingsController.getSettings);
router.put("/settings", admin_settings_controller_1.AdminSettingsController.updateSettings);
router.post("/clear-cache", admin_settings_controller_1.AdminSettingsController.clearCache);
router.post("/seed-settings", admin_settings_controller_1.AdminSettingsController.seedSettings);
// user suspension endpoints
router.post("/users/:userId/suspend", admin_controller_1.AdminController.suspendUser);
router.post("/users/:userId/unsuspend", admin_controller_1.AdminController.unsuspendUser);
exports.default = router;
