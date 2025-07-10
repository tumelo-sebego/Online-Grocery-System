const mongoose = require('mongoose');

const storeSchema = mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere', // Geo-spatial index
      },
    },
    contactEmail: { type: String, unique: true, sparse: true },
    contactPhone: { type: String, unique: true, sparse: true },
    operatingHours: { type: String, default: 'Mon-Sun 8:00 AM - 8:00 PM' },
    // NEW FIELDS FOR EXTERNAL API INTEGRATION
    apiBaseUrl: { type: String, default: null }, // Base URL for the store's product API
    apiKey: { type: String, default: null, select: false }, // API Key (should be securely stored and not returned in queries)
    apiCredentials: { // More complex credentials if needed (e.g., client_id, client_secret)
      type: Object,
      default: {},
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

const Store = mongoose.model('Store', storeSchema);
module.exports = Store;