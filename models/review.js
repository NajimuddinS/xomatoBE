const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  restaurant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
  },
  food: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Food',
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can only review a restaurant or food once
ReviewSchema.index({ user: 1, restaurant: 1 }, { unique: true, partialFilterExpression: { restaurant: { $exists: true } } });
ReviewSchema.index({ user: 1, food: 1 }, { unique: true, partialFilterExpression: { food: { $exists: true } } });

module.exports = mongoose.model('Review', ReviewSchema);