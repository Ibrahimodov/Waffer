const express = require('express');
const {
  getFamilies,
  getFamily,
  getNearbyFamilies,
  getFamiliesBySpecialty,
  updateFamilyProfile,
  deleteFamily,
  uploadFamilyImages,
  addProduct,
  updateProduct,
  deleteProduct,
  getFamilyProducts,
  addCertification,
  removeCertification
} = require('../controllers/familyController');

const {
  protect,
  authorize,
  requireVerification,
  optionalAuth
} = require('../middleware/auth');

const router = express.Router();

// Public routes
router.route('/')
  .get(optionalAuth, getFamilies);

router.route('/nearby')
  .get(optionalAuth, getNearbyFamilies);

router.route('/specialty/:specialty')
  .get(optionalAuth, getFamiliesBySpecialty);

router.route('/:id')
  .get(optionalAuth, getFamily);

router.route('/:id/products')
  .get(optionalAuth, getFamilyProducts);

// Protected routes
router.use(protect);
router.use(requireVerification);

// Family owner routes
router.route('/profile')
  .put(authorize('productive_family'), updateFamilyProfile);

router.route('/profile/images')
  .put(authorize('productive_family'), uploadFamilyImages);

router.route('/products')
  .post(authorize('productive_family'), addProduct);

router.route('/products/:productId')
  .put(authorize('productive_family'), updateProduct)
  .delete(authorize('productive_family'), deleteProduct);

router.route('/certifications')
  .post(authorize('productive_family'), addCertification);

router.route('/certifications/:certificationId')
  .delete(authorize('productive_family'), removeCertification);

// Admin routes (future)
router.route('/:id')
  .delete(authorize('admin'), deleteFamily);

module.exports = router;