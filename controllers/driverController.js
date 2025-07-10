const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel');
const Driver = require('../models/driverModel');

// @desc    Get driver's assigned orders
// @route   GET /api/drivers/my-orders
// @access  Private (Driver)
const getMyAssignedOrders = asyncHandler(async (req, res) => {
  const driverId = req.user.profile; // Get driver profile ID from authenticated user

  const orders = await Order.find({ driver: driverId })
    .populate('customer', 'firstName lastName phoneNumber')
    .populate('items.productId', 'name imageUrl unit')
    .populate('items.storeId', 'name')
    .sort({ orderDate: -1 });

  res.json(orders);
});

// @desc    Update an order's status (for driver)
// @route   PUT /api/drivers/orders/:id/status
// @access  Private (Driver)
const updateOrderStatusDriver = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Ensure driver can only update orders assigned to them
  if (order.driver.toString() !== req.user.profile.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  // Define allowed status transitions for drivers
  const allowedTransitions = {
    assigned: ['picked_up', 'cancelled'], // Driver can pick up or cancel (if allowed)
    picked_up: ['out_for_delivery'],
    out_for_delivery: ['delivered'],
  };

  if (!allowedTransitions[order.status] || !allowedTransitions[order.status].includes(status)) {
    res.status(400);
    throw new Error(`Invalid status transition from '${order.status}' to '${status}'`);
  }

  order.status = status;
  if (status === 'delivered') {
    order.deliveredAt = new Date();
  }

  const updatedOrder = await order.save();
  res.json(updatedOrder);
});

// @desc    Update driver's current location
// @route   PUT /api/drivers/location
// @access  Private (Driver)
const updateDriverLocation = asyncHandler(async (req, res) => {
  const { coordinates } = req.body; // [longitude, latitude]
  const driverId = req.user.profile;

  if (!coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
    res.status(400);
    throw new Error('Invalid coordinates format. Expected [longitude, latitude].');
  }

  const driver = await Driver.findById(driverId);

  if (driver) {
    driver.currentLocation = {
      type: 'Point',
      coordinates: coordinates,
    };
    const updatedDriver = await driver.save();
    res.json({
      _id: updatedDriver._id,
      currentLocation: updatedDriver.currentLocation,
      message: 'Driver location updated successfully',
    });
  } else {
    res.status(404);
    throw new Error('Driver not found');
  }
});

// @desc    Toggle driver availability
// @route   PUT /api/drivers/availability
// @access  Private (Driver)
const toggleDriverAvailability = asyncHandler(async (req, res) => {
  const { isAvailable } = req.body;
  const driverId = req.user.profile;

  const driver = await Driver.findById(driverId);

  if (driver) {
    driver.isAvailable = isAvailable !== undefined ? isAvailable : !driver.isAvailable;
    const updatedDriver = await driver.save();
    res.json({
      _id: updatedDriver._id,
      isAvailable: updatedDriver.isAvailable,
      message: `Driver availability set to ${updatedDriver.isAvailable}`,
    });
  } else {
    res.status(404);
    throw new Error('Driver not found');
  }
});


module.exports = {
  getMyAssignedOrders,
  updateOrderStatusDriver,
  updateDriverLocation,
  toggleDriverAvailability,
};