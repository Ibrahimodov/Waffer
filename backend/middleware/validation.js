const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User registration validation
const validateUserRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('phone')
    .matches(/^(\+966|0)?[5][0-9]{8}$/)
    .withMessage('Please provide a valid Saudi phone number'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('userType')
    .isIn(['customer', 'shop', 'productive_family'])
    .withMessage('Invalid user type'),
  
  body('location.city')
    .trim()
    .isLength({ min: 2 })
    .withMessage('City is required'),
  
  handleValidationErrors
];

// Shop registration validation
const validateShopRegistration = [
  ...validateUserRegistration.slice(0, -1), // Exclude handleValidationErrors
  
  body('businessInfo.businessName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  
  body('businessInfo.commercialRegistration')
    .isLength({ min: 10, max: 10 })
    .isNumeric()
    .withMessage('Commercial registration must be exactly 10 digits'),
  
  body('businessInfo.businessType')
    .isIn(['restaurant', 'retail', 'service', 'grocery', 'pharmacy', 'electronics', 'clothing', 'other'])
    .withMessage('Invalid business type'),
  
  body('businessInfo.description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  
  handleValidationErrors
];

// Productive family registration validation
const validateFamilyRegistration = [
  ...validateUserRegistration.slice(0, -1), // Exclude handleValidationErrors
  
  body('businessInfo.businessName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Business name must be between 2 and 100 characters'),
  
  body('familyInfo.familySize')
    .isInt({ min: 1, max: 20 })
    .withMessage('Family size must be between 1 and 20'),
  
  body('familyInfo.specialties')
    .isArray({ min: 1 })
    .withMessage('At least one specialty is required'),
  
  body('familyInfo.specialties.*')
    .isIn(['food', 'handicrafts', 'textiles', 'beauty', 'education', 'other'])
    .withMessage('Invalid specialty'),
  
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  
  handleValidationErrors
];

// Password reset validation
const validatePasswordReset = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  
  handleValidationErrors
];

// New password validation
const validateNewPassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  
  handleValidationErrors
];

// Profile update validation
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .matches(/^(\+966|0)?[5][0-9]{8}$/)
    .withMessage('Please provide a valid Saudi phone number'),
  
  body('location.city')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('City must be at least 2 characters'),
  
  handleValidationErrors
];

module.exports = {
  validateUserRegistration,
  validateShopRegistration,
  validateFamilyRegistration,
  validateLogin,
  validatePasswordReset,
  validateNewPassword,
  validateProfileUpdate,
  handleValidationErrors
};