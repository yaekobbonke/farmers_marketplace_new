// modules/orders/orders.controller.ts
import { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { ZodError } from 'zod';

// ✅ No need for AuthRequest - Express.Request already has user property
// Thanks to your global declaration in authMiddleware

export class OrdersController {
  static async createOrder(req: Request, res: Response) {
    try {
      const userId = req.user!.id; // ✅ req.user is available globally
      const order = await OrdersService.createOrder(userId, req.body);
      
      res.status(201).json({
        success: true,
        message: 'Order created successfully',
        data: { orderId: order.id }
      });
    } catch (error: any) {
      console.error('Create order error:', error);
      
      // Handle specific errors
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      if (error.message.includes('Insufficient stock')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create order'
      });
    }
  }
  
  static async getOrderById(req: Request, res: Response) {
    try {
      const orderId = parseInt(req.params.id);
      
      // Validate orderId
      if (isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
      }
      
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      const order = await OrdersService.getOrderById(orderId, userId, userRole);
      
      res.json({
        success: true,
        data: order
      });
    } catch (error: any) {
      console.error('Get order error:', error);
      
      if (error.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch order'
      });
    }
  }
  
  static async getUserOrders(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters. Page must be >= 1, limit between 1-100'
        });
      }
      
      const result = await OrdersService.getUserOrders(userId, page, limit);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Get user orders error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch orders'
      });
    }
  }
  
  static async getFarmerOrders(req: Request, res: Response) {
    try {
      const farmerId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      
      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          error: 'Invalid pagination parameters. Page must be >= 1, limit between 1-100'
        });
      }
      
      // Only farmers can access this
      if (req.user!.role !== 'FARMER' && req.user!.role !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Access denied. Farmers only.'
        });
      }
      
      const result = await OrdersService.getFarmerOrders(farmerId, page, limit);
      
      res.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Get farmer orders error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch farmer orders'
      });
    }
  }
  
  static async updateOrderStatus(req: Request, res: Response) {
    try {
      const orderId = parseInt(req.params.id);
      
      // Validate orderId
      if (isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
      }
      
      // Validate status
      const { status, trackingNumber, reason } = req.body;
      const validStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
      
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
      
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      const order = await OrdersService.updateOrderStatus(orderId, userId, userRole, {
        status,
        trackingNumber,
        reason
      });
      
      res.json({
        success: true,
        message: 'Order status updated successfully',
        data: order
      });
    } catch (error: any) {
      console.error('Update order status error:', error);
      
      if (error.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      if (error.message === 'Unauthorized to update this order') {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to update order status'
      });
    }
  }
  
  static async cancelOrder(req: Request, res: Response) {
    try {
      const orderId = parseInt(req.params.id);
      
      // Validate orderId
      if (isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
      }
      
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      const order = await OrdersService.cancelOrder(orderId, userId, userRole);
      
      res.json({
        success: true,
        message: 'Order cancelled successfully',
        data: order
      });
    } catch (error: any) {
      console.error('Cancel order error:', error);
      
      if (error.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      if (error.message === 'Unauthorized to cancel this order') {
        return res.status(403).json({
          success: false,
          error: error.message
        });
      }
      
      if (error.message === 'Only pending orders can be cancelled') {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to cancel order'
      });
    }
  }
  
  // ✅ Additional utility method to get order statistics for buyer
  static async getOrderStats(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const stats = await OrdersService.getOrderStats(userId);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error: any) {
      console.error('Get order stats error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch order statistics'
      });
    }
  }
  
  // ✅ Additional utility method to track order status history
  static async getOrderStatusHistory(req: Request, res: Response) {
    try {
      const orderId = parseInt(req.params.id);
      
      if (isNaN(orderId)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid order ID'
        });
      }
      
      const userId = req.user!.id;
      const userRole = req.user!.role;
      
      const history = await OrdersService.getOrderStatusHistory(orderId, userId, userRole);
      
      res.json({
        success: true,
        data: history
      });
    } catch (error: any) {
      console.error('Get order status history error:', error);
      
      if (error.message === 'Order not found') {
        return res.status(404).json({
          success: false,
          error: error.message
        });
      }
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch order history'
      });
    }
  }
}