"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_service_1 = require("./category.service");
class CategoryController {
    constructor() {
        this.getAllCategories = async (req, res) => {
            try {
                const categories = await this.categoryService.getAllCategories();
                res.json({ success: true, data: categories });
            }
            catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        };
        this.getCategoryById = async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const category = await this.categoryService.getCategoryById(id);
                if (!category) {
                    return res.status(404).json({ success: false, message: "Category not found" });
                }
                res.json({ success: true, data: category });
            }
            catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        };
        this.createCategory = async (req, res) => {
            try {
                const category = await this.categoryService.createCategory(req.body);
                res.status(201).json({ success: true, data: category });
            }
            catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        };
        this.updateCategory = async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                const category = await this.categoryService.updateCategory(id, req.body);
                res.json({ success: true, data: category });
            }
            catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        };
        this.deleteCategory = async (req, res) => {
            try {
                const id = parseInt(req.params.id);
                await this.categoryService.deleteCategory(id);
                res.json({ success: true, message: "Category deleted successfully" });
            }
            catch (error) {
                res.status(500).json({ success: false, message: error.message });
            }
        };
        this.categoryService = new category_service_1.CategoryService();
    }
}
exports.CategoryController = CategoryController;
