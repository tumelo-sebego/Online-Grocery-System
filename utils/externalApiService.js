const ProductCatalog = require('../models/productCatalogModel');
const StoreProduct = require('../models/storeProductModel');

/**
 * Simulates fetching products from an external grocery store API
 * and mapping them to our internal ProductCatalog and StoreProduct models.
 * In a real application, this would involve actual HTTP requests (e.g., using axios or node-fetch).
 * Each store might have a different API structure, so you'd need specific logic for each.
 *
 * @param {Object} store - The Mongoose Store document, including apiBaseUrl, apiKey, and apiCredentials.
 * @returns {Object} Summary of synchronized products (e.g., new products added, existing updated).
 */
const syncProducts = async (store) => {
  console.log(`Attempting to sync products from ${store.name} using API: ${store.apiBaseUrl}`);

  let externalProducts = [];

  // --- MOCK API CALLS ---
  // In a real scenario, you'd make actual HTTP requests here.
  // Example:
  // try {
  //   const response = await fetch(`${store.apiBaseUrl}/products?apiKey=${store.apiKey}`);
  //   if (!response.ok) {
  //     throw new Error(`API call failed with status ${response.status}`);
  //   }
  //   externalProducts = await response.json();
  // } catch (error) {
  //   console.error(`Failed to fetch from ${store.name} API:`, error);
  //   throw new Error(`Could not fetch products from ${store.name}.`);
  // }

  // Using mock data based on store name for demonstration
  if (store.name.includes('Shoprite')) {
    externalProducts = [
      {
        externalId: 'SRPROD001',
        name: 'Shoprite Full Cream Milk',
        description: 'Shoprite brand long life full cream milk, 1 litre.',
        price: 21.50,
        unit: 'litre',
        category: 'Dairy & Milk',
        imageUrl: 'https://placehold.co/150x150/000000/FFFFFF?text=SR+Milk',
        brand: 'Shoprite',
        available: true,
      },
      {
        externalId: 'SRPROD002',
        name: 'Shoprite Fresh Eggs',
        description: 'Dozen large fresh eggs.',
        price: 35.00,
        unit: 'dozen',
        category: 'Dairy & Eggs',
        imageUrl: 'https://placehold.co/150x150/000000/FFFFFF?text=SR+Eggs',
        brand: 'Shoprite',
        available: true,
      },
      {
        externalId: 'SRPROD003',
        name: 'Shoprite White Sugar',
        description: '2.5kg bag of white sugar.',
        price: 55.00,
        unit: 'kg',
        category: 'Baking',
        imageUrl: 'https://placehold.co/150x150/000000/FFFFFF?text=SR+Sugar',
        brand: 'Shoprite',
        available: false, // Example of unavailable product
      },
    ];
  } else if (store.name.includes('Pick')) {
    externalProducts = [
      {
        externalId: 'PNPITEM101',
        name: 'PnP Full Cream Milk',
        description: 'Pick n Pay brand long life full cream milk, 1 litre.',
        price: 22.00,
        unit: 'litre',
        category: 'Dairy & Milk',
        imageUrl: 'https://placehold.co/150x150/000000/FFFFFF?text=PNP+Milk',
        brand: 'PnP',
        available: true,
      },
      {
        externalId: 'PNPITEM102',
        name: 'PnP Brown Bread',
        description: 'Freshly baked brown bread loaf.',
        price: 20.00,
        unit: 'loaf',
        category: 'Bakery',
        imageUrl: 'https://placehold.co/150x150/000000/FFFFFF?text=PNP+Bread',
        brand: 'PnP',
        available: true,
      },
    ];
  } else if (store.name.includes('Boxer')) {
    externalProducts = [
      {
        externalId: 'BXITEM201',
        name: 'Boxer Super Maize Meal',
        description: '2.5kg bag of maize meal.',
        price: 38.00,
        unit: 'kg',
        category: 'Staples',
        imageUrl: 'https://placehold.co/150x150/000000/FFFFFF?text=Boxer+Maize',
        brand: 'Boxer',
        available: true,
      },
    ];
  } else {
    console.warn(`No mock data for store: ${store.name}`);
    return { newProducts: 0, updatedOfferings: 0, unchangedOfferings: 0 };
  }
  // --- END MOCK API CALLS ---


  let newProductsAdded = 0;
  let updatedOfferings = 0;
  let unchangedOfferings = 0;

  for (const extProduct of externalProducts) {
    // 1. Find or create the generic ProductCatalog entry
    let productCatalogEntry = await ProductCatalog.findOne({ name: extProduct.name, brand: extProduct.brand });

    if (!productCatalogEntry) {
      // If generic product doesn't exist, create it
      productCatalogEntry = await ProductCatalog.create({
        name: extProduct.name,
        description: extProduct.description || 'No description provided.',
        unit: extProduct.unit || 'unit',
        category: extProduct.category || 'Uncategorized',
        imageUrl: extProduct.imageUrl || 'https://placehold.co/150x150/CCCCCC/000000?text=No+Image',
        brand: extProduct.brand || 'Generic',
      });
      newProductsAdded++;
      console.log(`Created new ProductCatalog entry: ${productCatalogEntry.name}`);
    }

    // 2. Find or update the StoreProduct offering
    let storeProductOffering = await StoreProduct.findOne({
      storeId: store._id,
      productId: productCatalogEntry._id,
    });

    if (storeProductOffering) {
      // Update existing offering
      const isChanged =
        storeProductOffering.price !== extProduct.price ||
        storeProductOffering.isAvailableAtStore !== extProduct.available ||
        storeProductOffering.storeSpecificProductId !== extProduct.externalId ||
        storeProductOffering.externalProductUrl !== extProduct.externalProductUrl;

      if (isChanged) {
        storeProductOffering.price = extProduct.price;
        storeProductOffering.isAvailableAtStore = extProduct.available;
        storeProductOffering.storeSpecificProductId = extProduct.externalId;
        storeProductOffering.externalProductUrl = extProduct.externalProductUrl || null;
        storeProductOffering.lastCheckedAvailability = new Date();
        await storeProductOffering.save();
        updatedOfferings++;
        console.log(`Updated StoreProduct offering for ${productCatalogEntry.name} at ${store.name}`);
      } else {
        unchangedOfferings++;
        console.log(`StoreProduct offering for ${productCatalogEntry.name} at ${store.name} is unchanged.`);
      }
    } else {
      // Create new offering
      await StoreProduct.create({
        storeId: store._id,
        productId: productCatalogEntry._id,
        storeSpecificProductId: extProduct.externalId,
        price: extProduct.price,
        isAvailableAtStore: extProduct.available,
        externalProductUrl: extProduct.externalProductUrl || null,
        lastCheckedAvailability: new Date(),
      });
      updatedOfferings++; // Count as updated because it's a new offering
      console.log(`Created new StoreProduct offering for ${productCatalogEntry.name} at ${store.name}`);
    }
  }

  return {
    newProductsAdded,
    updatedOfferings,
    unchangedOfferings,
  };
};

module.exports = {
  syncProducts,
};