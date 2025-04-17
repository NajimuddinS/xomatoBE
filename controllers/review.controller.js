const Review = require('../models/review.js');
const Restaurant = require('../models/restaurant.js');
const Food = require('../models/food.js');

// @desc    Create a review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res) => {
  try {
    const { restaurant, food, rating, comment } = req.body;

    // Validate that either restaurant or food is provided, but not both
    if ((!restaurant && !food) || (restaurant && food)) {
      return res.status(400).json({ message: 'Provide either restaurant or food ID' });
    }

    // Check if the user has already reviewed this restaurant or food
    const existingReview = await Review.findOne({
      user: req.user._id,
      $or: [{ restaurant }, { food }],
    });

    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this item' });
    }

    // Validate restaurant or food exists
    if (restaurant) {
      const restaurantExists = await Restaurant.findById(restaurant);
      if (!restaurantExists) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
    } else {
      const foodExists = await Food.findById(food);
      if (!foodExists) {
        return res.status(404).json({ message: 'Food not found' });
      }
    }

    const review = new Review({
      user: req.user._id,
      restaurant: restaurant || null,
      food: food || null,
      rating,
      comment,
    });

    const createdReview = await review.save();
    res.status(201).json(createdReview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get reviews for a restaurant
// @route   GET /api/reviews/restaurant/:restaurantId
// @access  Public
const getRestaurantReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ restaurant: req.params.restaurantId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get reviews for a food item
// @route   GET /api/reviews/food/:foodId
// @access  Public
const getFoodReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ food: req.params.foodId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get user's reviews
// @route   GET /api/reviews/my-reviews
// @access  Private
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate('restaurant', 'name')
      .populate('food', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a review
// @route   PUT /api/reviews/:id
// @access  Private/Review Owner
const updateReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is the review owner
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;

    const updatedReview = await review.save();
    res.json(updatedReview);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a review
// @route   DELETE /api/reviews/:id
// @access  Private/Review Owner or Admin
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check if user is the review owner or admin
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await review.remove();
    res.json({ message: 'Review removed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  createReview,
  getRestaurantReviews,
  getFoodReviews,
  getMyReviews,
  updateReview,
  deleteReview,
};