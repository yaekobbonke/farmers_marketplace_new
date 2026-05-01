"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = require("./product.service");
const product_schema_1 = require("./product.schema");
const zod_1 = require("zod");
class ProductController {
    /**
     * POST /api/product
     * Creates a product and assigns it to the authenticated farmer.
     */
    static async create(req, res) {
        try {
            console.log("🛠️ BODY RECEIVED:", req.body);
            // 1. Validate the incoming data
            const data = product_schema_1.createProductSchema.parse(req.body);
            // 2. Identify the Farmer
            const farmerId = req.user?.id;
            if (!farmerId) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication failed: No User ID found in token"
                });
            }
            // 3. Save to Database
            const product = await product_service_1.ProductService.create(Number(farmerId), data);
            return res.status(201).json({
                success: true,
                message: "Product listed successfully",
                data: product
            });
        }
        catch (error) {
            if (error instanceof zod_1.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Validation Error",
                    errors: error.issues.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                });
            }
            console.error("🔥 Create Product Error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                detail: error.message // Helps identify DB issues in production
            });
        }
    }
    /**
     * GET /api/product
     * Fetches all products. Added logging to debug 500 errors.
     */
    static async getAll(req, res) {
        try {
            console.log("📦 Request received: Fetching all products...");
            const products = await product_service_1.ProductService.getAll(req.query);
            return res.json({
                success: true,
                count: products.length,
                data: products
            });
        }
        catch (error) {
            // This will now print the EXACT error (e.g., Prisma connection) in Render Logs
            console.error("❌ GET_ALL_PRODUCTS_ERROR:", error);
            return res.status(500).json({
                success: false,
                message: "Failed to fetch products",
                detail: error.message // This reveals the hidden error in the browser/Postman
            });
        }
    }
    /**
     * GET /api/product/:id
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const numericId = Number(id);
            if (isNaN(numericId)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid ID format: ${id} is not a number`
                });
            }
            const product = await product_service_1.ProductService.getById(numericId);
            if (!product) {
                return res.status(404).json({ success: false, message: "Product not found" });
            }
            return res.json({ success: true, data: product });
        }
        catch (error) {
            console.error("🔥 getById Error:", error);
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                detail: error.message
            });
        }
    }
    /**
     * PATCH /api/product/:id
     */
    static async update(req, res) {
        try {
            const id = Number(req.params.id);
            const farmerId = req.user?.id;
            const data = product_schema_1.updateProductSchema.parse(req.body);
            const product = await product_service_1.ProductService.update(id, Number(farmerId), data);
            return res.json({
                success: true,
                message: "Product updated successfully",
                data: product
            });
        }
        catch (error) {
            console.error("🔥 Update Error:", error);
            const status = error instanceof zod_1.ZodError ? 400 : 403;
            return res.status(status).json({
                success: false,
                message: error.message || "Update failed"
            });
        }
    }
    /**
     * DELETE /api/product/:id
     */
    static async remove(req, res) {
        try {
            const id = Number(req.params.id);
            const farmerId = req.user?.id;
            await product_service_1.ProductService.remove(id, Number(farmerId));
            return res.status(204).send();
        }
        catch (error) {
            console.error("🔥 Delete Error:", error);
            return res.status(403).json({
                success: false,
                message: error.message || "Delete failed"
            });
        }
    }
}
exports.ProductController = ProductController;
