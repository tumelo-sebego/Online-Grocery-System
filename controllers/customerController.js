const asyncHandler = require('express-async-handler');
const ProductCatalog = require('../models/productCatalogModel');
const StoreProduct = require('../models/storeProductModel');
const Store = require('../models/storeModel');
const Order = require('../models/orderModel');
const Customer = require('../models/customerModel');

// @desc    Get all products with prices from different stores
// @route   GET /api/customers/products
// @access  Public
const getProducts = asyncHandler(async (req, res) => {
  // This query will fetch all generic products and then
  // lookup their prices from different stores
  const products = await ProductCatalog.aggregate([
    {
      $lookup: {
        from: 'storeproducts', // The collection name for StoreProduct model
        localField: '_id',
        foreignField: 'productId',
        as: 'storeOfferings',
      },
    },
    {
      $unwind: {
        path: '$storeOfferings',
        preserveNullAndEmptyArrays: true, // Keep products even if no store offering
      },
    },
    {
      $lookup: {
        from: 'stores', // The collection name for Store model
        localField: 'storeOfferings.storeId',
        foreignField: '_id',
        as: 'storeInfo',
      },
    },
    {
      $unwind: {
        path: '$storeInfo',
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $group: {
        _id: '$_id',
        name: { $first: '$name' },
        description: { $first: '$description' },
        unit: { $first: '$unit' },
        category: { $first: '$category' },
        imageUrl: { $first: '$imageUrl' },
        brand: { $first: '$brand' },
        offerings: {
          $push: {
            storeId: '$storeOfferings.storeId',
            storeName: '$storeInfo.name',
            price: '$storeOfferings.price',
            isAvailableAtStore: '$storeOfferings.isAvailableAtStore',
            lastChecked: '$storeOfferings.lastCheckedAvailability',
            storeProductId: '$storeOfferings._id', // Reference to the specific store_product document
          },
        },
      },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        description: 1,
        unit: 1,
        category: 1,
        imageUrl: 1,
        brand: 1,
        offerings: {
          $filter: { // Filter out null offerings if preserveNullAndEmptyArrays was used
            input: '$offerings',
            as: 'offering',
            cond: { $ne: ['$$offering.storeId', null] },
          },
        },
      },
    },
  ]);

  res.json(products);
});

// @desc    Place a new order
// @route   POST /api/customers/orders
// @access  Private (Customer)
const placeOrder = asyncHandler(async (req, res) => {
  const { items, deliveryAddress, paymentMethod, deliverySlotStart, deliverySlotEnd, notes } = req.body;
  const customerId = req.user.profile; // Get customer profile ID from authenticated user

  if (!items || items.length === 0 || !deliveryAddress || !paymentMethod) {
    res.status(400);
    throw new Error('Please include all required order details');
  }

  const customer = await Customer.findById(customerId);
  if (!customer) {
    res.status(404);
    throw new Error('Customer profile not found');
  }

  let totalAmount = 0;
  const processedItems = [];
  const deliveryFee = 25.00; // Example fixed delivery fee

  for (const item of items) {
    const storeProduct = await StoreProduct.findById(item.storeProductId)
      .populate('productId') // Populate generic product info
      .populate('storeId'); // Populate store info

    if (!storeProduct || !storeProduct.isAvailableAtStore) {
      res.status(400);
      throw new Error(`Product ${item.name} from ${storeProduct?.storeId?.name || 'unknown store'} is not available.`);
    }

    const itemPrice = storeProduct.price * item.quantity;
    totalAmount += itemPrice;

    processedItems.push({
      productId: storeProduct.productId._id,
      storeId: storeProduct.storeId._id,
      storeProductId: storeProduct._id,
      name: storeProduct.productId.name,
      quantity: item.quantity,
      priceAtOrder: storeProduct.price,
    });
  }

  totalAmount += deliveryFee;

  const order = await Order.create({
    customer: customerId,
    items: processedItems,
    totalAmount,
    deliveryFee,
    deliveryAddress,
    customerPhone: customer.phoneNumber, // Denormalize phone number
    paymentMethod,
    paymentStatus: paymentMethod === 'cash' ? 'pending' : 'paid', // Simple payment status logic
    deliverySlotStart,
    deliverySlotEnd,
    notes,
    orderDate: new Date(),
  });

  res.status(201).json(order);
});

// @desc    Get customer's orders
// @route   GET /api/customers/orders
// @access  Private (Customer)
const getCustomerOrders = asyncHandler(async (req, res) => {
  const customerId = req.user.profile; // Get customer profile ID from authenticated user

  const orders = await Order.find({ customer: customerId })
    .populate('items.productId', 'name imageUrl unit') // Populate product name, image, unit
    .populate('items.storeId', 'name') // Populate store name
    .sort({ orderDate: -1 }); // Latest orders first

  res.json(orders);
});

// @desc    Get a single order by ID for customer
// @route   GET /api/customers/orders/:id
// @access  Private (Customer)
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'firstName lastName phoneNumber')
    .populate('driver', 'firstName lastName phoneNumber')
    .populate('items.productId', 'name imageUrl unit')
    .populate('items.storeId', 'name');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Ensure customer can only view their own orders
  if (order.customer.toString() !== req.user.profile.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this order');
  }

  res.json(order);
});


module.exports = {
  getProducts,
  placeOrder,
  getCustomerOrders,
  getOrderById,
};