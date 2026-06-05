// modules/orders/orders.routes.ts
import { Router } from 'express';
import { OrdersController } from './orders.controller';
import { authenticate, requireRole } from '../../middleware/authMiddleware';

const router = Router();

// ✅ All order routes require authentication
router.use(authenticate);

// Create order
router.post('/', OrdersController.createOrder);

// Get user's own orders
router.get('/my-orders', OrdersController.getUserOrders);

// Get farmer's orders (for farmers only)
router.get('/farmer-orders', requireRole('FARMER', 'ADMIN'), OrdersController.getFarmerOrders);

// Get specific order
router.get('/:id', OrdersController.getOrderById);

// Update order status (farmers/admins only)
router.patch('/:id/status', requireRole('FARMER', 'ADMIN'), OrdersController.updateOrderStatus);

// Cancel order
router.post('/:id/cancel', OrdersController.cancelOrder);

export default router;