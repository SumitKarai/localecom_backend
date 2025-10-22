const express = require('express');
const passport = require('../config/passport');
const Store = require('../models/Store');
const Product = require('../models/Product');
const router = express.Router();

// Create store
router.post('/', 
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { 
        name, 
        description, 
        category, 
        address,
        city,
        state,
        pincode,
        phone, 
        whatsapp,
        location,
        logo,
        banner,
        deliveryRadius
      } = req.body;
      
      // Check if user already has a store
      const existingStore = await Store.findOne({ ownerId: req.user._id });
      if (existingStore) {
        return res.status(400).json({ error: 'User already has a store' });
      }

      const store = new Store({
        ownerId: req.user._id,
        name,
        description,
        category,
        address,
        city,
        state,
        pincode,
        phone,
        whatsapp,
        email: req.user.email,
        location,
        logo,
        banner,
        deliveryRadius: deliveryRadius || 5
      });

      await store.save();
      res.status(201).json({ message: 'Store created successfully', store });
    } catch (error) {
      console.error('❌ Error creating store:', error);
      res.status(500).json({ error: 'Failed to create store' });
    }
  }
);

// Get user's store
router.get('/my-store',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const store = await Store.findOne({ ownerId: req.user._id });
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }
      res.json({ store });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch store' });
    }
  }
);

// Update store
router.put('/my-store',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const store = await Store.findOneAndUpdate(
        { ownerId: req.user._id },
        req.body,
        { new: true, runValidators: true }
      );
      if (!store) {
        return res.status(404).json({ error: 'Store not found' });
      }
      res.json({ message: 'Store updated successfully', store });
    } catch (error) {
      console.error('❌ Error updating store:', error);
      res.status(500).json({ error: 'Failed to update store' });
    }
  }
);

// Add product to store
router.post('/:storeId/products',
  passport.authenticate('jwt', { session: false }),
  async (req, res) => {
    try {
      const { name, description, category, price, quantity, unit } = req.body;
      const { storeId } = req.params;

      // Verify store ownership
      const store = await Store.findOne({ _id: storeId, ownerId: req.user._id });
      if (!store) {
        return res.status(403).json({ error: 'Store not found or access denied' });
      }

      const product = new Product({
        storeId,
        name,
        description,
        category,
        price,
        inventory: {
          quantity: quantity || 0,
          unit: unit || 'piece'
        }
      });

      await product.save();
      res.status(201).json({ message: 'Product added successfully', product });
    } catch (error) {
      console.error('❌ Error adding product:', error);
      res.status(500).json({ error: 'Failed to add product' });
    }
  }
);

// Get store products
router.get('/:storeId/products',
  async (req, res) => {
    try {
      const products = await Product.find({ 
        storeId: req.params.storeId,
        isActive: true 
      });
      res.json({ products });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch products' });
    }
  }
);

// Get store categories
router.get('/categories', async (req, res) => {
  try {
    const categories = [
      'Grocery & Food',
      'Electronics',
      'Clothing & Fashion',
      'Pharmacy & Health',
      'Books & Stationery',
      'Home & Garden',
      'Sports & Fitness',
      'Beauty & Personal Care',
      'Toys & Games',
      'Automotive',
      'Jewelry & Accessories',
      'Pet Supplies',
      'Hardware & Tools',
      'Bakery & Sweets',
      'Flowers & Gifts',
      'Other'
    ];
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get Indian states
router.get('/states', async (req, res) => {
  try {
    const states = [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
      'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
      'Dadra and Nagar Haveli and Daman and Diu', 'Lakshadweep',
      'Andaman and Nicobar Islands'
    ];
    res.json({ states });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch states' });
  }
});

// Get cities by state
router.get('/cities/:state', async (req, res) => {
  try {
    const { state } = req.params;
    const citiesByState = {
      'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Sangli', 'Jalgaon', 'Akola'],
      'Delhi': ['New Delhi', 'Central Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'North East Delhi', 'North West Delhi', 'South East Delhi', 'South West Delhi'],
      'Karnataka': ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Gulbarga', 'Davanagere', 'Bellary', 'Bijapur', 'Shimoga'],
      'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tirunelveli', 'Erode', 'Vellore', 'Thoothukudi', 'Dindigul'],
      'Gujarat': ['Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Junagadh', 'Gandhinagar', 'Anand', 'Navsari'],
      'Rajasthan': ['Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Bhilwara', 'Alwar', 'Bharatpur', 'Sikar'],
      'West Bengal': ['Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Malda', 'Bardhaman', 'Kharagpur', 'Haldia', 'Raiganj'],
      'Uttar Pradesh': ['Lucknow', 'Kanpur', 'Ghaziabad', 'Agra', 'Varanasi', 'Meerut', 'Allahabad', 'Bareilly', 'Aligarh', 'Moradabad'],
      'Haryana': ['Gurgaon', 'Faridabad', 'Panipat', 'Ambala', 'Yamunanagar', 'Rohtak', 'Hisar', 'Karnal', 'Sonipat', 'Panchkula'],
      'Punjab': ['Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Firozpur', 'Batala', 'Pathankot', 'Moga'],
      'Telangana': ['Hyderabad', 'Warangal', 'Nizamabad', 'Khammam', 'Karimnagar', 'Ramagundam', 'Mahbubnagar', 'Nalgonda', 'Adilabad', 'Suryapet'],
      'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Kurnool', 'Rajahmundry', 'Tirupati', 'Kakinada', 'Anantapur', 'Vizianagaram'],
      'Kerala': ['Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Palakkad', 'Alappuzha', 'Malappuram', 'Kannur', 'Kasaragod'],
      'Odisha': ['Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore', 'Bhadrak', 'Baripada', 'Jharsuguda'],
      'Jharkhand': ['Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro', 'Deoghar', 'Phusro', 'Hazaribagh', 'Giridih', 'Ramgarh', 'Medininagar'],
      'Assam': ['Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon', 'Karimganj', 'Sivasagar'],
      'Bihar': ['Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Bihar Sharif', 'Arrah', 'Begusarai', 'Katihar'],
      'Chhattisgarh': ['Raipur', 'Bhilai', 'Korba', 'Bilaspur', 'Durg', 'Rajnandgaon', 'Jagdalpur', 'Raigarh', 'Ambikapur', 'Mahasamund'],
      'Goa': ['Panaji', 'Vasco da Gama', 'Margao', 'Mapusa', 'Ponda', 'Bicholim', 'Curchorem', 'Sanquelim', 'Cuncolim', 'Quepem'],
      'Himachal Pradesh': ['Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Palampur', 'Baddi', 'Nahan', 'Paonta Sahib', 'Sundernagar', 'Chamba'],
      'Jammu and Kashmir': ['Srinagar', 'Jammu', 'Baramulla', 'Anantnag', 'Sopore', 'KathuaUdhampur', 'Punch', 'Rajauri'],
      'Madhya Pradesh': ['Bhopal', 'Indore', 'Gwalior', 'Jabalpur', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'],
      'Manipur': ['Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching', 'Ukhrul', 'Senapati', 'Tamenglong', 'Jiribam', 'Chandel'],
      'Meghalaya': ['Shillong', 'Tura', 'Cherrapunji', 'Jowai', 'Baghmara', 'Nongpoh', 'Mawkyrwat', 'Resubelpara', 'Ampati', 'Williamnagar'],
      'Mizoram': ['Aizawl', 'Lunglei', 'Saiha', 'Champhai', 'Kolasib', 'Serchhip', 'Mamit', 'Lawngtlai', 'Saitual', 'Khawzawl'],
      'Nagaland': ['Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha', 'Zunheboto', 'Phek', 'Kiphire', 'Longleng', 'Peren'],
      'Sikkim': ['Gangtok', 'Namchi', 'Geyzing', 'Mangan', 'Jorethang', 'Naya Bazar', 'Rangpo', 'Singtam', 'Gyalshing', 'Pakyong'],
      'Tripura': ['Agartala', 'Dharmanagar', 'Udaipur', 'Kailasahar', 'Belonia', 'Khowai', 'Pratapgarh', 'Ranir Bazar', 'Sonamura', 'Kumarghat'],
      'Uttarakhand': ['Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Kotdwar', 'Ramnagar', 'Manglaur'],
      'Arunachal Pradesh': ['Itanagar', 'Naharlagun', 'Pasighat', 'Namsai', 'Bomdila', 'Ziro', 'Along', 'Basar', 'Khonsa', 'Tezu'],
      'Ladakh': ['Leh', 'Kargil', 'Nubra', 'Zanskar', 'Drass', 'Nyoma', 'Durbuk', 'Khalsi', 'Sankoo', 'Padum'],
      'Puducherry': ['Puducherry', 'Karaikal', 'Mahe', 'Yanam', 'Villianur', 'Ariyankuppam', 'Bahour', 'Nettapakkam', 'Mannadipet', 'Ozhukarai'],
      'Chandigarh': ['Chandigarh'],
      'Dadra and Nagar Haveli and Daman and Diu': ['Daman', 'Diu', 'Silvassa', 'Dadra', 'Nagar Haveli'],
      'Lakshadweep': ['Kavaratti', 'Agatti', 'Minicoy', 'Amini', 'Andrott', 'Kalpeni', 'Kadmat', 'Kiltan', 'Chetlat', 'Bitra'],
      'Andaman and Nicobar Islands': ['Port Blair', 'Diglipur', 'Mayabunder', 'Rangat', 'Havelock', 'Neil Island', 'Car Nicobar', 'Nancowry', 'Little Andaman', 'Baratang']
    };
    
    const cities = citiesByState[state] || [];
    res.json({ cities });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Get stores with progressive distance expansion
router.get('/', async (req, res) => {
  try {
    const { lat, lng, city, state, category, search } = req.query;
    let stores = [];
    let actualRadius = null;
    
    // GPS-based search with progressive expansion
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      const distances = [2, 5, 10, 20, 50]; // Progressive distances in km
      
      for (const distance of distances) {
        const query = {
          isActive: true,
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              },
              $maxDistance: distance * 1000 // Convert km to meters
            }
          }
        };
        
        if (city) query.city = city;
        if (state) query.state = state;
        if (category) query.category = category;
        if (search) query.name = new RegExp(search, 'i');
        
        stores = await Store.find(query)
          .select('name description category address city state phone whatsapp location rating totalReviews')
          .limit(100);
          
        actualRadius = distance;
        if (stores.length >= 20) break; // Stop when we have enough stores
      }
    }
    // City/State-based search
    else {
      const query = { isActive: true };
      if (city) query.city = city;
      if (state) query.state = state;
      if (category) query.category = category;
      if (search) query.name = new RegExp(search, 'i');
      
      stores = await Store.find(query)
        .select('name description category address city state phone whatsapp location rating totalReviews')
        .limit(100);
    }
    
    res.json({ stores, actualRadius });
  } catch (error) {
    console.error('Error fetching stores:', error);
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Search stores by city/state
router.get('/search/location', async (req, res) => {
  try {
    const { city, state, category } = req.query;
    const query = { isActive: true };
    
    if (city) query.city = new RegExp(city, 'i');
    if (state) query.state = new RegExp(state, 'i');
    if (category) query.category = category;
    
    const stores = await Store.find(query)
      .select('name description category address city state phone location')
      .limit(50);
      
    res.json({ stores });
  } catch (error) {
    res.status(500).json({ error: 'Failed to search stores' });
  }
});

module.exports = router;
