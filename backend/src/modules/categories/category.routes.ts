import { Router } from "express";
import { CategoryController } from "./category.controller";
import { authMiddleware } from "../../middleware/authMiddleware";

const router = Router();
const categoryController = new CategoryController();

// Public routes
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);
router.get("/slug/:slug", categoryController.getCategoryBySlug);

// Protected routes (admin only)
router.post("/", authMiddleware, categoryController.createCategory);
router.put("/:id", authMiddleware, categoryController.updateCategory);
router.delete("/:id", authMiddleware, categoryController.deleteCategory);

export default router;