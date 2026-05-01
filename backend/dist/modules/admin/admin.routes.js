"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("./admin.controller");
const admin_middleware_1 = require("../admin/admin.middleware");
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
// Apply security to all routes in this file
router.use(auth_middleware_1.authenticate, admin_middleware_1.isAdmin);
router.get("/stats", admin_controller_1.AdminController.getSystemStats);
router.get("/pending-products", admin_controller_1.AdminController.getPendingProducts);
router.patch("/verify/:id", admin_controller_1.AdminController.verifyProduct);
router.get("/users", admin_controller_1.AdminController.getAllUsers);
exports.default = router;
