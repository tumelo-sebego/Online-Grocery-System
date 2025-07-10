const express = require('express');
const router = express.Router();
const {
  getProducts,
  placeOrder,
  getCustomerOrders,
  getOrderById,
} = require('../controllers/customerController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// Public routes for browsing products
router.get('/products', getProducts);

// Protected routes for authenticated customers
router.use(protect); // All routes below this require authentication
router.use(authorizeRoles('customer')); // Only customers can access these

router.post('/orders', placeOrder);
router.get('/orders', getCustomerOrders);
router.get('/orders/:id', getOrderById);

module.exports = router;