const mongoose = require('mongoose');

const storeProductSchema = mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
    },
    productId: { // Refers to the generic product in ProductCatalog
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductCatalog',
      required: true,
    },
    storeSpecificProductId: { type: String }, // Optional: ID from the external store's system
    price: { type: Number, required: true, min: 0 },
    lastCheckedAvailability: { type: Date, default: Date.now },
    isAvailableAtStore: { type: Boolean, default: true }, // Latest known availability from store data
    externalProductUrl: { type: String }, // URL to the product on the store's website
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness for a product offering at a specific store
storeProductSchema.index({ storeId: 1, productId: 1 }, { unique: true });

const StoreProduct = mongoose.model('StoreProduct', storeProductSchema);
module.exports = StoreProduct;