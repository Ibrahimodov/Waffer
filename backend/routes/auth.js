const express = require('express');
const {
  register,
  registerShop,
  registerFamily,
  login,
  logout,
  getMe,
  forgotPassword,
  resetPassword,
  updatePassword,
  verifyEmail,
  resendVerification,
  nafathAuth,
  nafathCallback
} = require('../controllers/authController');

const {
  validateUserRegistration,
  validateShopRegistration,
  validateFamilyRegistration,
  validateLogin,
  validatePasswordReset,
  validateNewPassword
} = require('../middleware/validation');

const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', validateUserRegistration, register);
router.post('/register/shop', validateShopRegistration, registerShop);
router.post('/register/family', validateFamilyRegistration, registerFamily);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validatePasswordReset, forgotPassword);
router.put('/reset-password/:resettoken', validateNewPassword, resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// Nafath authentication routes
router.post('/nafath/auth', nafathAuth);
router.post('/nafath/callback', nafathCallback);

// Protected routes
router.use(protect); // All routes after this middleware are protected

router.post('/logout', logout);
router.get('/me', getMe);
router.put('/update-password', validateNewPassword, updatePassword);

module.exports = router;