import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authenticate, isAdmin } from "../../middleware/authMiddleware";

const router = Router();

// Public routes
router.post("/register", AuthController.register);
router.post("/login", AuthController.login);

// Protected routes (require authentication)
router.use(authenticate);

// User routes
router.get("/profile", AuthController.getProfile);
router.put("/profile", AuthController.updateProfile);
router.post("/change-password", AuthController.changePassword);
router.delete("/account", AuthController.deleteAccount);
router.post("/account/deactivate", AuthController.deactivateAccount);

// Admin only routes
router.use(isAdmin);

router.get("/users", AuthController.getAllUsers);
router.post("/users/:userId/promote", AuthController.promoteToAdmin);
router.post("/users/:userId/demote", AuthController.demoteFromAdmin);
router.put("/users/:userId/role", AuthController.changeUserRole);
router.post("/users/:userId/suspend", AuthController.suspendUser);
router.post("/users/:userId/unsuspend", AuthController.unsuspendUser);

export default router;