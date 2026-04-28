import { Request, Response } from "express";
import { AdminService } from "./admin.service";

export class AdminController {
  /**
   * Fetches system-wide analytics for the dashboard cards.
   */
  static async getStats(req: Request, res: Response) {
    try {
      const stats = await AdminService.getSystemStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Retrieves products that need verification.
   */
  static async getPendingProducts(req: Request, res: Response) {
    try {
      const products = await AdminService.getPendingProducts();
      res.status(200).json({
        success: true,
        data: products,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  /**
   * Approves a product by its ID.
   */
  static async verifyProduct(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updatedProduct = await AdminService.verifyProduct(Number(id));
      
      res.status(200).json({
        success: true,
        message: "Product verified successfully",
        data: updatedProduct,
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
  static async getUsers(req: Request, res: Response) {
    try {
      const users = await AdminService.getAllUsers();
      
      res.status(200).json({
        success: true,
        message: "Users retrieved successfully",
        data: users,
      });
    } catch (error: any) {
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch users",
        error: error.message 
      });
    }
  }
}