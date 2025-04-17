const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderById,
  getMyOrders,
  getRestaurantOrders,
  updateOrderToDelivered,
  updateOrderStatus,
  cancelOrder,
} = require('../controllers/order.controller.js');
const { protect } = require('../middlewares/auth.middleware.js');
const { authRole } = require('../middlewares/verifyRole.middleware.js');
const { ROLES } = require('../config/roles.js');

router.post('/', protect, createOrder);
router.get('/:id', protect, getOrderById);
router.get('/myorders', protect, getMyOrders);
router.get(
  '/restaurant',
  protect,
  authRole(ROLES.RESTAURANT),
  getRestaurantOrders
);
router.put(
  '/:id/deliver',
  protect,
  authRole(ROLES.RESTAURANT),
  updateOrderToDelivered
);
router.put(
  '/:id/status',
  protect,
  authRole(ROLES.RESTAURANT),
  updateOrderStatus
);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;