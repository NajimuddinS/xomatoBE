const express = require('express');
const router = express.Router();
const {
  getFoods,
  getFoodsByRestaurant,
  getFoodById,
  createFood,
  updateFood,
  uploadFoodImages,
  deleteFoodImage,
  deleteFood,
} = require('../controllers/food.controller');
const { protect } = require('../middlewares/auth.middleware.js');
const { authRole } = require('../middlewares/verifyRole.middleware.js');
const { ROLES } = require('../config/roles.js');
const { storage } = require('../config/cloudinary');
const multer = require('multer');
const upload = multer({ storage });

router.get('/', getFoods);
router.get('/restaurant/:restaurantId', getFoodsByRestaurant);
router.get('/:id', getFoodById);
router.post('/', protect, authRole(ROLES.RESTAURANT), createFood);
router.put('/:id', protect, authRole(ROLES.RESTAURANT), updateFood);
router.put(
  '/:id/images',
  protect,
  authRole(ROLES.RESTAURANT),
  upload.array('images', 5),
  uploadFoodImages
);
router.delete(
  '/:id/images/:imageId',
  protect,
  authRole(ROLES.RESTAURANT),
  deleteFoodImage
);
router.delete('/:id', protect, authRole(ROLES.RESTAURANT), deleteFood);

module.exports = router;