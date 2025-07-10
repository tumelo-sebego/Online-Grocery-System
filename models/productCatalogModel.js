const mongoose = require('mongoose');

const productCatalogSchema = mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    unit: { type: String, required: true }, // e.g., "kg", "pack", "piece"
    category: { type: String, required: true }, // e.g., "Dairy & Milk", "Bakery"
    imageUrl: { type: String },
    brand: { type: String },
  },
  {
    timestamps: true,
  }
);

const ProductCatalog = mongoose.model('ProductCatalog', productCatalogSchema);
module.exports = ProductCatalog;