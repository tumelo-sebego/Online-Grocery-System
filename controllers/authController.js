const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Customer = require('../models/customerModel');
const Driver = require('../models/driverModel');

// Helper function to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Register a new user (customer, admin, or driver)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { email, password, role, firstName, lastName, phoneNumber, address } = req.body;

  if (!email || !password || !role || !firstName || !lastName) {
    res.status(400);
    throw new Error('Please enter all required fields');
  }

  // Check if user already exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Create User
  const user = await User.create({ email, password, role });

  if (user) {
    let profile;
    if (role === 'customer') {
      profile = await Customer.create({
        firstName,
        lastName,
        phoneNumber,
        addresses: address ? [address] : [],
        userId: user._id,
      });
    } else if (role === 'driver') {
      // For driver, you'd need licenseNumber, vehicleDetails etc.
      // For simplicity, adding basic fields here.
      profile = await Driver.create({
        firstName,
        lastName,
        phoneNumber,
        licenseNumber: req.body.licenseNumber || 'N/A', // Required for driver
        vehicleDetails: req.body.vehicleDetails || 'N/A',
        userId: user._id,
      });
    } else if (role === 'admin') {
      // Admin profile might be simpler, or a separate Admin model
      // For now, just link to user
      profile = { _id: user._id, firstName, lastName }; // Placeholder for admin profile
    } else {
      res.status(400);
      throw new Error('Invalid user role');
    }

    // Link profile to user
    user.profile = profile._id;
    await user.save();

    res.status(201).json({
      _id: user._id,
      email: user.email,
      role: user.role,
      profileId: profile._id,
      token: generateToken(user._id),
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Check for user email
  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      profileId: user.profile, // Return profile ID
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Get user profile (for logged-in user)
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').populate('profile'); // Populate the specific profile

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = { registerUser, loginUser, getUserProfile };