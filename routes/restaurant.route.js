const express = require('express');
const router = express.Router();
const {
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  uploadRestaurantImages,
  deleteRestaurantImage,
} = require('../controllers/restaurant.controller.js');
const { protect } = require('../middlewares/auth.middleware.js');
const { authRole } = require('../middlewares/verifyRole.middleware.js');
const { ROLES } = require('../config/roles.js');
const { storage } = require('../config/cloudinary.js');
const multer = require('multer');
const upload = multer({ storage });

router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);
router.put('/:id', protect, authRole(ROLES.RESTAURANT), updateRestaurant);
router.put(
  '/:id/images',
  protect,
  authRole(ROLES.RESTAURANT),
  upload.array('images', 5),
  uploadRestaurantImages
);
router.delete(
  '/:id/images/:imageId',
  protect,
  authRole(ROLES.RESTAURANT),
  deleteRestaurantImage
);

module.exports = router;