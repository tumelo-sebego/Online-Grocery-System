const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs'); // For hashing passwords for seeded users

// Load env vars
const dotenvResult = dotenv.config({ path: './.env' }); // Capture the result

// Log the result of dotenv.config()
if (dotenvResult.error) {
  console.error('dotenv config error:', dotenvResult.error);
} else {
  console.log('dotenv parsed variables:', dotenvResult.parsed);
}

// Now, log the MONGO_URI to see its value
console.log('MONGO_URI from process.env:', process.env.MONGO_URI);


// Load models
const User = require('../models/userModel');
const Customer = require('../models/customerModel');
const Driver = require('../models/driverModel');
const Store = require('../models/storeModel');
const ProductCatalog = require('../models/productCatalogModel');
const StoreProduct = require('../models/storeProductModel');
const Order = require('../models/orderModel');

// Connect to DB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected for Seeder...'))
  .catch(err => {
    console.error(`DB Connection Error: ${err.message}`);
    process.exit(1);
  });

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany();
    await Customer.deleteMany();
    await Driver.deleteMany();
    await Store.deleteMany();
    await ProductCatalog.deleteMany();
    await StoreProduct.deleteMany();
    await Order.deleteMany();
    console.log('All existing data cleared!');

    // Create Users (with hashed passwords)
    const adminUser = await User.create({
      email: 'admin@example.com',
      password: 'password123', // Will be hashed by pre-save hook
      role: 'admin',
    });

    const customerUser = await User.create({
      email: 'customer@example.com',
      password: 'password123',
      role: 'customer',
    });

    const driverUser = await User.create({
      email: 'driver@example.com',
      password: 'password123',
      role: 'driver',
    });

    // Create Profiles and link to Users
    const customerProfile = await Customer.create({
      firstName: 'John',
      lastName: 'Doe',
      phoneNumber: '+27712345678',
      addresses: [{
        street: '123 Pretorius Street',
        city: 'Pretoria',
        stateProvince: 'Gauteng',
        postalCode: '0002',
        country: 'South Africa',
        isDefault: true
      }],
      userId: customerUser._id,
    });
    customerUser.profile = customerProfile._id;
    await customerUser.save();

    const driverProfile = await Driver.create({
      firstName: 'Sipho',
      lastName: 'Dlamini',
      phoneNumber: '+27601112222',
      licenseNumber: 'DLA87654321',
      vehicleDetails: 'White Toyota Quantum, GP 123-456',
      isAvailable: true,
      currentLocation: { type: 'Point', coordinates: [28.2100, -25.7500] },
      userId: driverUser._id,
    });
    driverUser.profile = driverProfile._id;
    await driverUser.save();

    // Create Stores (with mock API details)
    const shoprite = await Store.create({
      name: "Shoprite Pretoria North",
      address: { street: "Pretoria North Main Rd", city: "Pretoria", postalCode: "0182", coordinates: [28.1878, -25.7533] },
      contactEmail: "pretoria.north@shoprite.co.za",
      contactPhone: "+27125467890",
      apiBaseUrl: "https://mock-shoprite-api.com/v1", // Mock API URL
      apiKey: "SHOPRITE_API_KEY_123", // Mock API Key
    });

    const pnp = await Store.create({
      name: "Pick 'n Pay Brooklyn Mall",
      address: { street: "Cnr Fehrsen & Middle St", city: "Pretoria", postalCode: "0181", coordinates: [28.2324, -25.7865] },
      contactEmail: "brooklyn@pnp.co.za",
      contactPhone: "+27123456789",
      apiBaseUrl: "https://mock-pnp-api.com/v2", // Mock API URL
      apiKey: "PNP_API_KEY_456", // Mock API Key
    });

    const boxer = await Store.create({
      name: "Boxer Superstores Sunnyside",
      address: { street: "283 Celliers St", city: "Pretoria", postalCode: "0002", coordinates: [28.2045, -25.7650] },
      contactEmail: "sunnyside@boxer.co.za",
      contactPhone: "+27129876543",
      apiBaseUrl: "https://mock-boxer-api.com/v1", // Mock API URL
      apiKey: "BOXER_API_KEY_789", // Mock API Key
    });

    // NOTE: Products and StoreProducts will now be populated via the sync endpoint
    // We remove the direct seeding of ProductCatalog and StoreProduct here
    // to demonstrate the API integration.

    // Create an example Order (referencing existing seeded data for now,
    // or you can add a small set of initial products/store_products if needed for testing orders before sync)
    // For demonstration, let's create a minimal set of initial products/store_products
    // that the seeder will create, and then the sync will add more.

    // Initial Product Catalog Items (for order to work before sync)
    const milk = await ProductCatalog.create({
      name: "Full Cream Milk",
      description: "Long life full cream milk, 1 litre carton.",
      unit: "litre",
      category: "Dairy & Milk",
      imageUrl: "https://placehold.co/150x150/000000/FFFFFF?text=Milk",
      brand: "Clover",
    });

    const bread = await ProductCatalog.create({
      name: "White Bread (Large)",
      description: "Standard large loaf of white bread.",
      unit: "loaf",
      category: "Bakery",
      imageUrl: "https://placehold.co/150x150/000000/FFFFFF?text=Bread",
      brand: "Albany",
    });

    // Initial Store Product Offerings
    const shopriteMilk = await StoreProduct.create({
      storeId: shoprite._id,
      productId: milk._id,
      storeSpecificProductId: "SR12345_initial",
      price: 22.99,
      isAvailableAtStore: true,
    });

    const boxerBread = await StoreProduct.create({
      storeId: boxer._id,
      productId: bread._id,
      storeSpecificProductId: "BX001122_initial",
      price: 18.00,
      isAvailableAtStore: true,
    });


    // Create an example Order
    await Order.create({
      customer: customerProfile._id,
      driver: driverProfile._id,
      items: [
        {
          productId: milk._id,
          storeId: shoprite._id,
          storeProductId: shopriteMilk._id,
          name: milk.name,
          quantity: 2,
          priceAtOrder: shopriteMilk.price,
        },
        {
          productId: bread._id,
          storeId: boxer._id,
          storeProductId: boxerBread._id,
          name: bread.name,
          quantity: 1,
          priceAtOrder: boxerBread.price,
        },
      ],
      totalAmount: (2 * shopriteMilk.price) + (1 * boxerBread.price) + 25.00, // Items + delivery fee
      deliveryFee: 25.00,
      status: 'assigned',
      deliveryAddress: {
        street: '123 Pretorius Street',
        city: 'Pretoria',
        postalCode: '0002',
        coordinates: [28.1900, -25.7500],
      },
      customerPhone: customerProfile.phoneNumber,
      driverPhone: driverProfile.phoneNumber,
      paymentMethod: 'card',
      paymentStatus: 'paid',
      orderDate: new Date(Date.now() - 3600000), // 1 hour ago
      deliverySlotStart: new Date(Date.now() + 3600000), // 1 hour from now
      deliverySlotEnd: new Date(Date.now() + 7200000), // 2 hours from now
      notes: 'Please leave at front door.',
    });

    console.log('Data seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error seeding data: ${error.message}`);
    process.exit(1);
  }
};

// Command line argument to destroy data
if (process.argv[2] === '-d') {
  const destroyData = async () => {
    try {
      await User.deleteMany();
      await Customer.deleteMany();
      await Driver.deleteMany();
      await Store.deleteMany();
      await ProductCatalog.deleteMany();
      await StoreProduct.deleteMany();
      await Order.deleteMany();
      console.log('All data destroyed!');
      process.exit();
    } catch (error) {
      console.error(`Error destroying data: ${error.message}`);
      process.exit(1);
    }
  };
  destroyData();
} else {
  seedData();
}