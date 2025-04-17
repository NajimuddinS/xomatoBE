const Food = require('../models/food.js');
const Restaurant = require('../models/restaurant.js');
const { cloudinary } = require('../config/cloudinary');

// @desc    Get all foods
// @route   GET /api/foods
// @access  Public
const getFoods = async (req, res) => {
  try {
    const foods = await Food.find().populate('restaurant', 'name location');
    res.json(foods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get foods by restaurant
// @route   GET /api/foods/restaurant/:restaurantId
// @access  Public
const getFoodsByRestaurant = async (req, res) => {
  try {
    const foods = await Food.find({ restaurant: req.params.restaurantId });
    res.json(foods);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single food
// @route   GET /api/foods/:id
// @access  Public
const getFoodById = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id).populate(
      'restaurant',
      'name location'
    );

    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    res.json(food);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create food
// @route   POST /api/foods
// @access  Private/Restaurant Owner or Admin
const createFood = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.body.restaurant);

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

    const { name, description, price, category } = req.body;

    const food = new Food({
      name,
      description,
      price,
      restaurant: restaurant._id,
      category,
    });

    const createdFood = await food.save();
    res.status(201).json(createdFood);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update food
// @route   PUT /api/foods/:id
// @access  Private/Restaurant Owner or Admin
const updateFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    const restaurant = await Restaurant.findById(food.restaurant);

    // Check if user is restaurant owner or admin
    if (
      restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const { name, description, price, category, isAvailable } = req.body;

    food.name = name || food.name;
    food.description = description || food.description;
    food.price = price || food.price;
    food.category = category || food.category;
    food.isAvailable = isAvailable !== undefined ? isAvailable : food.isAvailable;

    const updatedFood = await food.save();
    res.json(updatedFood);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Upload food images
// @route   PUT /api/foods/:id/images
// @access  Private/Restaurant Owner or Admin
const uploadFoodImages = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    const restaurant = await Restaurant.findById(food.restaurant);

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

    // Add images to food
    const newImages = results.map(result => ({
      public_id: result.public_id,
      url: result.secure_url,
    }));

    food.images = [...food.images, ...newImages];
    await food.save();

    res.json(food);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete food image
// @route   DELETE /api/foods/:id/images/:imageId
// @access  Private/Restaurant Owner or Admin
const deleteFoodImage = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    const restaurant = await Restaurant.findById(food.restaurant);

    // Check if user is restaurant owner or admin
    if (
      restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Find the image to delete
    const imageIndex = food.images.findIndex(
      image => image.public_id === req.params.imageId
    );

    if (imageIndex === -1) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(req.params.imageId);

    // Remove from food images
    food.images.splice(imageIndex, 1);
    await food.save();

    res.json(food);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete food
// @route   DELETE /api/foods/:id
// @access  Private/Restaurant Owner or Admin
const deleteFood = async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);

    if (!food) {
      return res.status(404).json({ message: 'Food not found' });
    }

    const restaurant = await Restaurant.findById(food.restaurant);

    // Check if user is restaurant owner or admin
    if (
      restaurant.owner.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    // Delete images from Cloudinary
    const deletePromises = food.images.map(image => {
      return cloudinary.uploader.destroy(image.public_id);
    });

    await Promise.all(deletePromises);

    await food.remove();
    res.json({ message: 'Food removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getFoods,
  getFoodsByRestaurant,
  getFoodById,
  createFood,
  updateFood,
  uploadFoodImages,
  deleteFoodImage,
  deleteFood,
};