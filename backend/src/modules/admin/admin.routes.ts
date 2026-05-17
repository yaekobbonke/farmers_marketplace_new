// backend/src/modules/admin/index.ts

import { Router } from "express";
import { AdminController } from "./admin.controller";
import { AdminSettingsController } from "./admin.settings.controller";
import { authenticate, requireRole } from "../../middleware/authMiddleware";

const router = Router();

// ✅ Apply authentication first, then admin role check
router.use(authenticate);
router.use(requireRole("ADMIN"));  // This will now work

// Dashboard stats
router.get("/stats", AdminController.getStats);
router.get("/recent-activity", AdminController.getRecentActivity);
router.get("/sales-data", AdminController.getSalesData);

// User management
router.get("/users", AdminController.getAllUsers);
router.put("/users/:userId/role", AdminController.updateUserRole);
router.patch("/users/:userId/suspend", AdminController.toggleSuspendUser);
router.delete("/users/:userId", AdminController.deleteUser);

// Product management routes
router.get("/products", AdminController.getAllProducts);
router.patch("/products/:productId/verify", AdminController.verifyProduct);
router.patch("/products/:productId/feature", AdminController.featureProduct);
router.delete("/products/:productId", AdminController.deleteProduct);

// Settings routes
router.get("/settings", AdminSettingsController.getSettings);
router.put("/settings", AdminSettingsController.updateSettings);
router.post("/clear-cache", AdminSettingsController.clearCache);
router.post("/seed-settings", AdminSettingsController.seedSettings);

// User suspension endpoints
router.post("/users/:userId/suspend", AdminController.suspendUser);
router.post("/users/:userId/unsuspend", AdminController.unsuspendUser);

export default router;