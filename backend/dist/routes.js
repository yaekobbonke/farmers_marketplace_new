"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// ✅ Use require to bypass type checking
const { Router } = require('express');
const index_1 = __importDefault(require("./modules/products/index"));
const index_2 = __importDefault(require("./modules/auth/index"));
const index_3 = __importDefault(require("./modules/prices/index"));
const index_4 = __importDefault(require("./modules/search/index"));
const index_5 = __importDefault(require("./modules/assistant/index"));
const index_6 = __importDefault(require("./modules/admin/index"));
const router = Router();
router.get("/", (req, res) => {
    return res.json({ message: "API is running" });
});
router.use("/auth", index_2.default);
router.use("/product", index_1.default);
router.use("/prices", index_3.default);
router.use("/search", index_4.default);
router.use("/assistant", index_5.default);
router.use("/admin", index_6.default);
exports.default = router;
