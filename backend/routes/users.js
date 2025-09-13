const express = require('express');
const {
  getUsers,
  getUser,
  updateProfile,
  deleteUser,
  uploadAvatar,
  updateLocation,
  updateBusinessInfo,
  updateFamilyInfo,
  updateNotificationSettings
} = require('../controllers/userController');

const {
  validateProfileUpdate
} = require('../middleware/validation');

const {
  protect,
  authorize,
  requireVerification
} = require('../middleware/auth');

const router = express.Router();

// All routes are protected
router.use(protect);

// User profile routes
router.route('/profile')
  .put(validateProfileUpdate, updateProfile);

router.route('/profile/avatar')
  .put(uploadAvatar);

router.route('/profile/location')
  .put(updateLocation);

router.route('/profile/business')
  .put(authorize('shop', 'productive_family'), updateBusinessInfo);

router.route('/profile/family')
  .put(authorize('productive_family'), updateFamilyInfo);

router.route('/profile/notifications')
  .put(updateNotificationSettings);

// User management routes (admin only in future)
router.route('/')
  .get(authorize('admin'), getUsers);

router.route('/:id')
  .get(getUser)
  .delete(deleteUser);

module.exports = router;