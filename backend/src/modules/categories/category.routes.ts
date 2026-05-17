import { Router } from "express";
import { CategoryController } from "./category.controller";
import { authenticate, requireRole } from "../../middleware/authMiddleware";

const router = Router();
const categoryController = new CategoryController();

// Public routes
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// Admin only routes - authenticate first, then check role
router.post("/", authenticate, requireRole("ADMIN"), categoryController.createCategory);
router.put("/:id", authenticate, requireRole("ADMIN"), categoryController.updateCategory);
router.delete("/:id", authenticate, requireRole("ADMIN"), categoryController.deleteCategory);

export default router;