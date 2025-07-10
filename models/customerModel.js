const mongoose = require('mongoose');

const addressSchema = mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  stateProvince: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'South Africa' },
  isDefault: { type: Boolean, default: false },
});

const customerSchema = mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phoneNumber: { type: String, unique: true, sparse: true }, // sparse allows nulls to not violate unique
    addresses: [addressSchema], // Array of embedded address documents
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

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;