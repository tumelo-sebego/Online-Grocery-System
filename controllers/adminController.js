const asyncHandler = require('express-async-handler');
const Customer = require('../models/customerModel');
const Driver = require('../models/driverModel');
const Order = require('../models/orderModel');
const Store = require('../models/storeModel');
const ProductCatalog = require('../models/productCatalogModel');
const StoreProduct = require('../models/storeProductModel');
const User = require('../models/userModel'); // For managing user accounts
const externalApiService = require('../utils/externalApiService'); // NEW IMPORT

// --- User Management ---
// @desc    Get all users (customers, drivers, admins)
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password').populate('profile');
  res.json(users);
});

// @desc    Update user role
// @route   PUT /api/admin/users/:id/role
// @access  Private (Admin)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.id);

  if (user) {
    user.role = role || user.role;
    const updatedUser = await user.save();
    res.json({
      _id: updatedUser._id,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// --- Order Management ---
// @desc    Get all orders
// @route   GET /api/admin/orders
// @access  Private (Admin)
const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({})
    .populate('customer', 'firstName lastName phoneNumber')
    .populate('driver', 'firstName lastName phoneNumber')
    .populate('items.productId', 'name imageUrl unit')
    .populate('items.storeId', 'name')
    .sort({ orderDate: -1 });
  res.json(orders);
});

// @desc    Get single order by ID
// @route   GET /api/admin/orders/:id
// @access  Private (Admin)
const getOrderByIdAdmin = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer', 'firstName lastName phoneNumber')
    .populate('driver', 'firstName lastName phoneNumber')
    .populate('items.productId', 'name imageUrl unit')
    .populate('items.storeId', 'name');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  res.json(order);
});

// @desc    Update order status
// @route   PUT /api/admin/orders/:id/status
// @access  Private (Admin)
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, driverId } = req.body; // driverId for assigning
  const order = await Order.findById(req.params.id);

  if (order) {
    order.status = status || order.status;
    if (driverId) {
      const driver = await Driver.findById(driverId);
      if (!driver) {
        res.status(404);
        throw new Error('Driver not found');
      }
      order.driver = driverId;
      order.driverPhone = driver.phoneNumber; // Denormalize
    }

    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// --- Store Management ---
// @desc    Get all stores
// @route   GET /api/admin/stores
// @access  Private (Admin)
const getStores = asyncHandler(async (req, res) => {
  const stores = await Store.find({});
  res.json(stores);
});

// @desc    Add a new store
// @route   POST /api/admin/stores
// @access  Private (Admin)
const addStore = asyncHandler(async (req, res) => {
  const { name, address, contactEmail, contactPhone, operatingHours, apiBaseUrl, apiKey, apiCredentials } = req.body;
  const store = await Store.create({ name, address, contactEmail, contactPhone, operatingHours, apiBaseUrl, apiKey, apiCredentials });
  res.status(201).json(store);
});

// @desc    Update store details (including API info)
// @route   PUT /api/admin/stores/:id
// @access  Private (Admin)
const updateStore = asyncHandler(async (req, res) => {
  const { name, address, contactEmail, contactPhone, operatingHours, apiBaseUrl, apiKey, apiCredentials } = req.body;
  const store = await Store.findById(req.params.id);

  if (store) {
    store.name = name || store.name;
    store.address = address || store.address;
    store.contactEmail = contactEmail || store.contactEmail;
    store.contactPhone = contactPhone || store.contactPhone;
    store.operatingHours = operatingHours || store.operatingHours;
    store.apiBaseUrl = apiBaseUrl !== undefined ? apiBaseUrl : store.apiBaseUrl;
    store.apiKey = apiKey !== undefined ? apiKey : store.apiKey; // Update API key if provided
    store.apiCredentials = apiCredentials !== undefined ? apiCredentials : store.apiCredentials;

    const updatedStore = await store.save();
    res.json(updatedStore);
  } else {
    res.status(404);
    throw new Error('Store not found');
  }
});

// NEW: @desc    Sync products from an external store API
// @route   POST /api/admin/stores/:storeId/sync-products
// @access  Private (Admin)
const syncProductsFromStore = asyncHandler(async (req, res) => {
  const { storeId } = req.params;

  const store = await Store.findById(storeId).select('+apiKey +apiCredentials'); // Select API key/credentials
  if (!store) {
    res.status(404);
    throw new Error('Store not found');
  }

  if (!store.apiBaseUrl || (!store.apiKey && Object.keys(store.apiCredentials).length === 0)) {
    res.status(400);
    throw new Error('Store is not configured with API details for synchronization.');
  }

  try {
    // Call the external service to fetch and process products
    const syncResult = await externalApiService.syncProducts(store);

    res.status(200).json({
      message: `Products synchronized successfully for ${store.name}.`,
      summary: syncResult,
    });
  } catch (error) {
    console.error(`Error syncing products for store ${store.name}:`, error);
    res.status(500);
    throw new Error(`Failed to synchronize products: ${error.message}`);
  }
});


// --- Product Catalog Management ---
// @desc    Get all generic products
// @route   GET /api/admin/product-catalog
// @access  Private (Admin)
const getProductCatalog = asyncHandler(async (req, res) => {
  const products = await ProductCatalog.find({});
  res.json(products);
});

// @desc    Get a single generic product by ID
// @route   GET /api/admin/product-catalog/:id
// @access  Private (Admin)
const getProductById = asyncHandler(async (req, res) => {
  const product = await ProductCatalog.findById(req.params.id);
  if (product) {
    res.json(product);
  } else {
    res.status(404);
    throw new Error('Product not found');
  }
});

// @desc    Add a new generic product
// @route   POST /api/admin/product-catalog
// @access  Private (Admin)
const addProductToCatalog = asyncHandler(async (req, res) => {
  const { name, description, unit, category, imageUrl, brand } = req.body;
  const product = await ProductCatalog.create({ name, description, unit, category, imageUrl, brand });
  res.status(201).json(product);
});

// --- Store Product Offerings Management ---
// @desc    Get all store product offerings
// @route   GET /api/admin/store-products
// @access  Private (Admin)
const getStoreProducts = asyncHandler(async (req, res) => {
  const storeProducts = await StoreProduct.find({})
    .populate('storeId', 'name')
    .populate('productId', 'name category unit');
  res.json(storeProducts);
});

// @desc    Add a new store product offering
// @route   POST /api/admin/store-products
// @access  Private (Admin)
const addStoreProduct = asyncHandler(async (req, res) => {
  const { storeId, productId, storeSpecificProductId, price, isAvailableAtStore, externalProductUrl } = req.body;
  const storeProduct = await StoreProduct.create({
    storeId,
    productId,
    storeSpecificProductId,
    price,
    isAvailableAtStore,
    externalProductUrl,
  });
  res.status(201).json(storeProduct);
});

// @desc    Update a store product offering (e.g., price, availability)
// @route   PUT /api/admin/store-products/:id
// @access  Private (Admin)
const updateStoreProduct = asyncHandler(async (req, res) => {
  const { price, isAvailableAtStore, externalProductUrl } = req.body;
  const storeProduct = await StoreProduct.findById(req.params.id);

  if (storeProduct) {
    storeProduct.price = price !== undefined ? price : storeProduct.price;
    storeProduct.isAvailableAtStore = isAvailableAtStore !== undefined ? isAvailableAtStore : storeProduct.isAvailableAtStore;
    storeProduct.externalProductUrl = externalProductUrl || storeProduct.externalProductUrl;
    storeProduct.lastCheckedAvailability = new Date(); // Update timestamp on change

    const updatedStoreProduct = await storeProduct.save();
    res.json(updatedStoreProduct);
  } else {
    res.status(404);
    throw new Error('Store Product offering not found');
  }
});


module.exports = {
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
  getProductById,
  addProductToCatalog,
  getStoreProducts,
  addStoreProduct,
  updateStoreProduct,
};