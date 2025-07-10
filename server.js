require('dotenv').config(); // Load environment variables from .env file
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Import Routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const driverRoutes = require('./routes/driverRoutes');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors()); // Enable CORS for all origins (adjust for production)
app.use(express.json()); // Body parser for JSON data

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes); // Customer-facing routes
app.use('/api/admin', adminRoutes);     // Admin dashboard routes (protected)
app.use('/api/drivers', driverRoutes);   // Driver app routes (protected)

// Basic home route
app.get('/', (req, res) => {
  res.send('Online Grocery Backend API is running...');
});

// Error Handling Middleware (should be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});