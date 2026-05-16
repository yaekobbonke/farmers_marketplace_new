"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// Public routes
router.post("/register", auth_controller_1.AuthController.register);
router.post("/login", auth_controller_1.AuthController.login);
// Protected routes (require authentication)
router.use(authMiddleware_1.authenticate);
// User routes
router.get("/profile", auth_controller_1.AuthController.getProfile);
router.put("/profile", auth_controller_1.AuthController.updateProfile);
router.post("/change-password", auth_controller_1.AuthController.changePassword);
router.delete("/account", auth_controller_1.AuthController.deleteAccount);
router.post("/account/deactivate", auth_controller_1.AuthController.deactivateAccount);
// Admin only routes
router.use(authMiddleware_1.isAdmin);
router.get("/users", auth_controller_1.AuthController.getAllUsers);
router.post("/users/:userId/promote", auth_controller_1.AuthController.promoteToAdmin);
router.post("/users/:userId/demote", auth_controller_1.AuthController.demoteFromAdmin);
router.put("/users/:userId/role", auth_controller_1.AuthController.changeUserRole);
router.post("/users/:userId/suspend", auth_controller_1.AuthController.suspendUser);
router.post("/users/:userId/unsuspend", auth_controller_1.AuthController.unsuspendUser);
exports.default = router;
