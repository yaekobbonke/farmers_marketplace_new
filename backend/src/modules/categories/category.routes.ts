import { Router } from "express";
import { CategoryController } from "./category.controller";
import { isAdmin } from "../../middleware/authMiddleware";

const router = Router();
const categoryController = new CategoryController();

// Public routes
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// Admin only routes
router.post("/", isAdmin, categoryController.createCategory);
router.put("/:id", isAdmin, categoryController.updateCategory);
router.delete("/:id", isAdmin, categoryController.deleteCategory);

export default router;