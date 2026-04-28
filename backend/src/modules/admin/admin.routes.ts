import { Router } from "express";
import { AdminController } from "./admin.controller";
import { isAdmin } from "../admin/admin.middleware";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

// Apply security to all routes in this file
router.use(authenticate, isAdmin);

router.get("/stats", AdminController.getStats);
router.get("/pending-products", AdminController.getPendingProducts);
router.patch("/verify/:id", AdminController.verifyProduct);
router.get("/users", AdminController.getUsers);

export default router;