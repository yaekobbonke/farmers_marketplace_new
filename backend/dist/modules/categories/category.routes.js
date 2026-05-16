"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const category_controller_1 = require("./category.controller");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
const categoryController = new category_controller_1.CategoryController();
// Public routes
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);
// Admin only routes
router.post("/", authMiddleware_1.isAdmin, categoryController.createCategory);
router.put("/:id", authMiddleware_1.isAdmin, categoryController.updateCategory);
router.delete("/:id", authMiddleware_1.isAdmin, categoryController.deleteCategory);
exports.default = router;
