import { Router } from "express";
import productRoutes from "./modules/products/index";
import authRoutes from "./modules/auth/index";
import priceRoutes from "./modules/prices/index";
import searchRoutes from "./modules/search/index";
import assistantRoutes from "./modules/assistant/index";
import adminRoutes from "./modules/admin/index";
import categoryRoutes from "./modules/categories/category.routes";
import notificationRoutes from "./modules/notifications/notification.routes";
import analyticsRoutes from "./modules/analytics/index";
import orderRoutes from "./modules/orders/index";

const router = Router();

router.get("/", (req: any, res: any) => {
    return res.json({ message: "API is running" });
});

router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/prices", priceRoutes);
router.use("/search", searchRoutes);
router.use("/assistant", assistantRoutes);
router.use("/admin", adminRoutes);
router.use("/categories", categoryRoutes);
router.use("/notifications", notificationRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/orders", orderRoutes);
export default router;