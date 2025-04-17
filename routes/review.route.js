const express = require('express');
const router = express.Router();
const {
  createReview,
  getRestaurantReviews,
  getFoodReviews,
  getMyReviews,
  updateReview,
  deleteReview,
} = require('../controllers/review.controller.js');
const { protect } = require('../middlewares/auth.middleware.js');

router.post('/', protect, createReview);
router.get('/restaurant/:restaurantId', getRestaurantReviews);
router.get('/food/:foodId', getFoodReviews);
router.get('/my-reviews', protect, getMyReviews);
router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;