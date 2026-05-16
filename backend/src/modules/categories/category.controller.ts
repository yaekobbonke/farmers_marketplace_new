import { Request, Response } from "express";
import { CategoryService } from "./category.service";

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  getAllCategories = async (req: Request, res: Response) => {
    try {
      const categories = await this.categoryService.getAllCategories();
      res.json({ success: true, data: categories });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  getCategoryById = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const category = await this.categoryService.getCategoryById(id);
      if (!category) {
        return res.status(404).json({ success: false, message: "Category not found" });
      }
      res.json({ success: true, data: category });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  createCategory = async (req: Request, res: Response) => {
    try {
      const category = await this.categoryService.createCategory(req.body);
      res.status(201).json({ success: true, data: category });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  updateCategory = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const category = await this.categoryService.updateCategory(id, req.body);
      res.json({ success: true, data: category });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  deleteCategory = async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      await this.categoryService.deleteCategory(id);
      res.json({ success: true, message: "Category deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}