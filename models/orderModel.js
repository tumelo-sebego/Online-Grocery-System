const mongoose = require('mongoose');

const orderItemSchema = mongoose.Schema({
  productId: { // Reference to the generic product
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCatalog',
    required: true,
  },
  storeId: { // Reference to the specific store it was sourced from
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
  },
  storeProductId: { // Reference to the specific store offering (price, availability)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'StoreProduct',
    required: true,
  },
  name: { type: String, required: true }, // Denormalized product name
  quantity: { type: Number, required: true, min: 1 },
  priceAtOrder: { type: Number, required: true, min: 0 }, // Price at the time of order
});

const orderSchema = mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Driver',
      default: null, // Null until assigned
    },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    deliveryFee: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryAddress: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      coordinates: { type: [Number], index: '2dsphere' }, // [longitude, latitude]
    },
    customerPhone: { type: String, required: true }, // Denormalized
    driverPhone: { type: String }, // Denormalized (if driver assigned)
    paymentMethod: { type: String, enum: ['cash', 'card', 'online_payment'], required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    orderDate: { type: Date, default: Date.now },
    deliverySlotStart: { type: Date },
    deliverySlotEnd: { type: Date },
    deliveredAt: { type: Date },
    notes: { type: String },
  },
  {
    timestamps: true,
  }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;