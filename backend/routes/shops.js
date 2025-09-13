const express = require('express');
const {
  getShops,
  getShop,
  getNearbyShops,
  getShopsByCategory,
  updateShopProfile,
  deleteShop,
  uploadShopImages,
  addOffer,
  updateOffer,
  deleteOffer,
  getShopOffers
} = require('../controllers/shopController');

const {
  protect,
  authorize,
  requireVerification,
  optionalAuth
} = require('../middleware/auth');

const router = express.Router();

// Public routes
router.route('/')
  .get(optionalAuth, getShops);

router.route('/nearby')
  .get(optionalAuth, getNearbyShops);

router.route('/category/:category')
  .get(optionalAuth, getShopsByCategory);

router.route('/:id')
  .get(optionalAuth, getShop);

router.route('/:id/offers')
  .get(optionalAuth, getShopOffers);

// Protected routes
router.use(protect);
router.use(requireVerification);

// Shop owner routes
router.route('/profile')
  .put(authorize('shop'), updateShopProfile);

router.route('/profile/images')
  .put(authorize('shop'), uploadShopImages);

router.route('/offers')
  .post(authorize('shop'), addOffer);

router.route('/offers/:offerId')
  .put(authorize('shop'), updateOffer)
  .delete(authorize('shop'), deleteOffer);

// Admin routes (future)
router.route('/:id')
  .delete(authorize('admin'), deleteShop);

module.exports = router;