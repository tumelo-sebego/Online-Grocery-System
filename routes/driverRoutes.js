const express = require('express');
const router = express.Router();
const {
  getMyAssignedOrders,
  updateOrderStatusDriver,
  updateDriverLocation,
  toggleDriverAvailability,
} = require('../controllers/driverController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// All driver routes require authentication and driver role
router.use(protect);
router.use(authorizeRoles('driver'));

router.get('/my-orders', getMyAssignedOrders);
router.put('/orders/:id/status', updateOrderStatusDriver);
router.put('/location', updateDriverLocation);
router.put('/availability', toggleDriverAvailability);

module.exports = router;