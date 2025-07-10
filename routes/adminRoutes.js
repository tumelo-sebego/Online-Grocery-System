const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  updateUserRole,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
  getStores,
  addStore,
  updateStore, // NEWLY ADDED
  syncProductsFromStore, // NEWLY ADDED
  getProductCatalog,
  addProductToCatalog,
  getStoreProducts,
  addStoreProduct,
  updateStoreProduct,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All admin routes require authentication and admin role
router.use(protect);
router.use(authorizeRoles('admin'));

// User Management
router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);

// Order Management
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderByIdAdmin);
router.put('/orders/:id/status', updateOrderStatus);

// Store Management
router.get('/stores', getStores);
router.post('/stores', addStore);
router.put('/stores/:id', updateStore); // Route to update store details, including API info
router.post('/stores/:storeId/sync-products', syncProductsFromStore); // NEW ROUTE

// Product Catalog Management (Generic Products)
router.get('/product-catalog', getProductCatalog);
router.post('/product-catalog', addProductToCatalog);

// Store Product Offerings Management (Specific prices/availability at stores)
router.get('/store-products', getStoreProducts);
router.post('/store-products', addStoreProduct);
router.put('/store-products/:id', updateStoreProduct);

module.exports = router;