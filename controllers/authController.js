const crypto = require('crypto');
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Customer = require('../models/customerModel');
const Driver = require('../models/driverModel');
const Admin = require('../models/adminModel');
const sendEmail = require('../utils/sendEmail');

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

  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const user = new User({ email, password, role });

  const verificationToken = crypto.randomBytes(20).toString('hex');
  user.verificationToken = verificationToken;

  await user.save();

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
      profile = await Driver.create({
        firstName,
        lastName,
        phoneNumber,
        licenseNumber: req.body.licenseNumber || 'N/A',
        vehicleDetails: req.body.vehicleDetails || 'N/A',
        userId: user._id,
      });
    } else if (role === 'admin') {
      profile = await Admin.create({
        firstName,
        lastName,
        userId: user._id,
      });
    } else {
      res.status(400);
      throw new Error('Invalid user role');
    }

    user.profile = profile._id;
    await user.save();

    // Send verification email
    const verificationUrl = `${req.protocol}://${req.get(
      'host'
    )}/api/auth/verify-email/${verificationToken}`;

    const message = `Thank you for registering! Please verify your email by clicking the following link: \n\n ${verificationUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Email Verification',
        message,
      });

      res.status(201).json({ message: 'Registration successful! Please check your email to verify your account.' });
    } catch (error) {
      console.error(error);
      user.verificationToken = undefined;
      await user.save();
      res.status(500);
      throw new Error('Email could not be sent');
    }
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

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    /* if (!user.isVerified) {
      res.status(401);
      throw new Error('Please verify your email before logging in.');
    } */

    res.json({
      _id: user._id,
      email: user.email,
      role: user.role,
      profileId: user.profile,
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
  const user = await User.findById(req.user._id).select('-password').populate('profile');

  if (user) {
    res.json(user);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired verification token.');
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  res.status(200).json({ message: 'Email verified successfully! You can now log in.' });
});

module.exports = { registerUser, loginUser, getUserProfile, verifyEmail };