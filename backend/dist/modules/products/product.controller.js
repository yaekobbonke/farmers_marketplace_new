"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const product_service_1 = require("./product.service");
class ProductController {
}
exports.ProductController = ProductController;
_a = ProductController;
// ✅ Get all products for marketplace
ProductController.getAll = async (req, res) => {
    try {
        const products = await product_service_1.ProductService.getAll();
        res.json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Get single product by ID - with view tracking
ProductController.getById = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }
        // ✅ Increment view count via service
        const product = await product_service_1.ProductService.getById(id, true);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }
        res.json({ success: true, data: product });
    }
    catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Get farmer's own products
ProductController.getFarmerProducts = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const products = await product_service_1.ProductService.getFarmerProducts(userId);
        res.json({ success: true, data: products });
    }
    catch (error) {
        console.error("Error fetching farmer products:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Get farmer's dashboard stats
ProductController.getFarmerStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const stats = await product_service_1.ProductService.getFarmerStats(userId);
        res.json({ success: true, data: stats });
    }
    catch (error) {
        console.error("Error fetching farmer stats:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Create new product
ProductController.create = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const product = await product_service_1.ProductService.create(userId, req.body);
        res.status(201).json({
            success: true,
            data: product,
            message: "Product created successfully and pending admin approval"
        });
    }
    catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Update product
ProductController.update = async (req, res) => {
    try {
        const userId = req.user?.id;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }
        const product = await product_service_1.ProductService.update(id, userId, req.body, req.user?.role);
        res.json({ success: true, data: product, message: "Product updated successfully" });
    }
    catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Delete product
ProductController.remove = async (req, res) => {
    try {
        const userId = req.user?.id;
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }
        await product_service_1.ProductService.remove(id, userId, req.user?.role);
        res.json({ success: true, message: "Product deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Get all products for admin
ProductController.getAllProductsAdmin = async (req, res) => {
    try {
        const products = await product_service_1.ProductService.getAllProductsAdmin();
        res.json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Verify product (admin only) - WITH NOTIFICATION TO FARMER
ProductController.verifyProduct = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }
        const product = await product_service_1.ProductService.verifyProduct(id);
        res.json({
            success: true,
            data: product,
            message: "Product verified successfully. Farmer has been notified."
        });
    }
    catch (error) {
        console.error("Error verifying product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Reject product (admin only) - WITH NOTIFICATION TO FARMER
ProductController.rejectProduct = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { reason } = req.body;
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }
        const product = await product_service_1.ProductService.rejectProduct(id, reason);
        res.json({
            success: true,
            data: product,
            message: "Product rejected successfully. Farmer has been notified."
        });
    }
    catch (error) {
        console.error("Error rejecting product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Feature product (admin only) - WITH NOTIFICATION TO FARMER
ProductController.featureProduct = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }
        const product = await product_service_1.ProductService.featureProduct(id);
        res.json({
            success: true,
            data: product,
            message: "Product featured successfully. Farmer has been notified."
        });
    }
    catch (error) {
        console.error("Error featuring product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Get products by category
ProductController.getProductsByCategory = async (req, res) => {
    try {
        const categoryId = parseInt(req.params.categoryId);
        if (isNaN(categoryId)) {
            return res.status(400).json({ success: false, message: "Invalid category ID" });
        }
        const products = await product_service_1.ProductService.getProductsByCategory(categoryId);
        res.json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Search products
ProductController.searchProducts = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || typeof q !== 'string') {
            return res.status(400).json({ success: false, message: "Search query is required" });
        }
        const products = await product_service_1.ProductService.searchProducts(q);
        res.json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Get featured products
ProductController.getFeaturedProducts = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 6;
        const products = await product_service_1.ProductService.getFeaturedProducts(limit);
        res.json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Update product stock
ProductController.updateStock = async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { quantitySold } = req.body;
        if (isNaN(id)) {
            return res.status(400).json({ success: false, message: "Invalid product ID" });
        }
        if (!quantitySold || isNaN(quantitySold)) {
            return res.status(400).json({ success: false, message: "Quantity sold is required" });
        }
        const product = await product_service_1.ProductService.updateStock(id, quantitySold);
        res.json({ success: true, data: product, message: "Stock updated successfully" });
    }
    catch (error) {
        console.error("Error updating stock:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Get low stock products
ProductController.getLowStockProducts = async (req, res) => {
    try {
        const userId = req.user?.id;
        const threshold = req.query.threshold ? parseInt(req.query.threshold) : 10;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const products = await product_service_1.ProductService.getLowStockProducts(userId, threshold);
        res.json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Get top viewed products for analytics
ProductController.getTopViewedProducts = async (req, res) => {
    try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 10;
        const products = await product_service_1.ProductService.getTopViewedProducts(limit);
        res.json({ success: true, data: products });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
// ✅ Get product analytics for farmer
ProductController.getProductAnalytics = async (req, res) => {
    try {
        const userId = req.user?.id;
        const period = req.query.period || "week";
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }
        const analytics = await product_service_1.ProductService.getProductAnalytics(userId, period);
        res.json({ success: true, data: analytics });
    }
    catch (error) {
        console.error("Error fetching product analytics:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
