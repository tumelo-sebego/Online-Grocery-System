const mongoose = require('mongoose');

const driverSchema = mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, unique: true, sparse: true },
    licenseNumber: { type: String, required: true, unique: true },
    vehicleDetails: { type: String },
    isAvailable: { type: Boolean, default: true },
    currentLocation: {
      type: {
        type: String, // Don't do `{ location: { type: String } }`
        enum: ['Point'], // 'location.type' must be 'Point'
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere', // Geo-spatial index
      },
    },
    userId: { // Link to the User model for authentication
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

const Driver = mongoose.model('Driver', driverSchema);
module.exports = Driver;