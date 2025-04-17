const Restaurant = require('../models/restaurant.js');
const Food = require('../models/food.js');
const Review = require('../models/review.js');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
const getRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().populate('owner', 'name email');
    res.json(restaurants);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single restaurant
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurantById = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate(
      'owner',
      'name email'
    );

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Get foods for this restaurant
    const foods = await Food.find({ restaurant: restaurant._id });
    
    // Get reviews for this restaurant
    const reviews = await Review.find({ restaurant: restaurant._id })
      .populate('user', 'name');

    res.json({
      ...restaurant._doc,
      foods,
      reviews,
      averageRating: calculateAverageRating(reviews),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private/Restaurant Owner or Admin
const updateRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user is restaurant owner or admin
    if (
      restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { name, description, location, cuisineType, openingHours, contactNumber } = req.body;

    restaurant.name = name || restaurant.name;
    restaurant.description = description || restaurant.description;
    restaurant.location = location || restaurant.location;
    restaurant.cuisineType = cuisineType || restaurant.cuisineType;
    restaurant.openingHours = openingHours || restaurant.openingHours;
    restaurant.contactNumber = contactNumber || restaurant.contactNumber;

    const updatedRestaurant = await restaurant.save();

    res.json(updatedRestaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Upload restaurant images
// @route   PUT /api/restaurants/:id/images
// @access  Private/Restaurant Owner or Admin
const uploadRestaurantImages = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user is restaurant owner or admin
    if (
      restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Get uploaded files
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    // Upload images to Cloudinary and get URLs
    const uploadPromises = files.map(file => {
      return cloudinary.uploader.upload(file.path);
    });

    const results = await Promise.all(uploadPromises);

    // Add images to restaurant
    const newImages = results.map(result => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));

    restaurant.images = [...restaurant.images, ...newImages];
    await restaurant.save();

    res.json(restaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete restaurant image
// @route   DELETE /api/restaurants/:id/images/:imageId
// @access  Private/Restaurant Owner or Admin
const deleteRestaurantImage = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if user is restaurant owner or admin
    if (
      restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Find the image to delete
    const imageIndex = restaurant.images.findIndex(
      image => image.public_id === req.params.imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(req.params.imageId);

    // Remove from restaurant images
    restaurant.images.splice(imageIndex, 1);
    await restaurant.save();

    res.json(restaurant);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Helper function to calculate average rating
const calculateAverageRating = (reviews) => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);
  return sum / reviews.length;
};

module.exports = {
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  uploadRestaurantImages,
  deleteRestaurantImage,
};