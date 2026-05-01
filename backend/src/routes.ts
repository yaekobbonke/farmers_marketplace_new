import { Router, Request, Response } from "express";  // ✅ Add Request and Response types
import productRoutes from "./modules/products/index"; 
import authRoutes from "./modules/auth/index";
import priceRoutes from "./modules/prices/index";
import searchRoutes from "./modules/search/index";
import assistantRoutes from "./modules/assistant/index";
import adminRoutes from "./modules/admin/index";

const router = Router();

// ✅ Add proper typing for req and res parameters
router.get("/", (req: Request, res: Response) => {
    return res.json({message: "API is running"});
});

router.use("/auth", authRoutes);
router.use("/product", productRoutes);
router.use("/prices", priceRoutes);
router.use("/search", searchRoutes);
router.use("/assistant", assistantRoutes);
router.use("/admin", adminRoutes);

export default router;