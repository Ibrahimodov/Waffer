const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  
  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        isVerified: user.isVerified,
        isNafathVerified: user.isNafathVerified,
        businessInfo: user.businessInfo,
        familyInfo: user.familyInfo,
        location: user.location
      }
    });
};

// @desc    Register customer
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    const { name, email, phone, password, location } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, password'
      });
    }

    // Validate location
    if (!location || !location.city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide location with city'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'phone';
      return res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`
      });
    }

    console.log(`Creating new customer account for: ${email}`);

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      userType: 'customer',
      location
    });

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // TODO: Send verification email
    console.log(`Verification token for ${email}: ${verificationToken}`);
    console.log(`Customer registration successful for: ${email}`);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    next(error);
  }
};

// @desc    Register shop
// @route   POST /api/auth/register/shop
// @access  Public
const registerShop = async (req, res, next) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      password, 
      location, 
      businessInfo 
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, password'
      });
    }

    // Validate location
    if (!location || !location.city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide location with city'
      });
    }

    // Validate business info
    if (!businessInfo || !businessInfo.businessName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide business information with business name'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email }, 
        { phone },
        { 'businessInfo.commercialRegistration': businessInfo.commercialRegistration }
      ].filter(condition => Object.values(condition)[0]) // Filter out undefined values
    });
    
    if (existingUser) {
      let field = 'email';
      if (existingUser.phone === phone) field = 'phone';
      if (existingUser.businessInfo?.commercialRegistration === businessInfo.commercialRegistration) {
        field = 'commercial registration';
      }
      return res.status(409).json({
        success: false,
        message: `Shop with this ${field} already exists`
      });
    }

    console.log(`Creating new shop account for: ${email}`);

    // Create shop user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      userType: 'shop',
      location,
      businessInfo
    });

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // TODO: Send verification email
    console.log(`Verification token for ${email}: ${verificationToken}`);
    console.log(`Shop registration successful for: ${email}`);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Shop registration error:', error);
    next(error);
  }
};

// @desc    Register productive family
// @route   POST /api/auth/register/family
// @access  Public
const registerFamily = async (req, res, next) => {
  try {
    const { 
      name, 
      email, 
      phone, 
      password, 
      location, 
      businessInfo,
      familyInfo 
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, email, phone, password'
      });
    }

    // Validate location
    if (!location || !location.city) {
      return res.status(400).json({
        success: false,
        message: 'Please provide location with city'
      });
    }

    // Validate family info
    if (!familyInfo || !familyInfo.familySize) {
      return res.status(400).json({
        success: false,
        message: 'Please provide family information with family size'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });
    
    if (existingUser) {
      const field = existingUser.email === email ? 'email' : 'phone';
      return res.status(409).json({
        success: false,
        message: `Productive family with this ${field} already exists`
      });
    }

    console.log(`Creating new productive family account for: ${email}`);

    // Create productive family user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      userType: 'productive_family',
      location,
      businessInfo,
      familyInfo
    });

    // Generate verification token
    const verificationToken = user.generateVerificationToken();
    await user.save();

    // TODO: Send verification email
    console.log(`Verification token for ${email}: ${verificationToken}`);
    console.log(`Productive family registration successful for: ${email}`);

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Family registration error:', error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Login attempt with missing credentials');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log(`Login attempt with non-existent email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log(`Login attempt with incorrect password for email: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (!user.isActive) {
      console.log(`Login attempt with deactivated account: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }

    console.log(`Successful login for user: ${email}`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get reset token
    const resetToken = user.generateResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // TODO: Send reset password email
    console.log(`Reset token: ${resetToken}`);

    res.status(200).json({
      success: true,
      message: 'Reset password email sent'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
const resetPassword = async (req, res, next) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(req.params.resettoken)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
const updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    user.password = req.body.password;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification token'
      });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email already verified'
      });
    }

    const verificationToken = user.generateVerificationToken();
    await user.save();

    // TODO: Send verification email
    console.log(`Verification token: ${verificationToken}`);

    res.status(200).json({
      success: true,
      message: 'Verification email sent'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Nafath authentication
// @route   POST /api/auth/nafath/auth
// @access  Public
const nafathAuth = async (req, res, next) => {
  try {
    const { nafathId, transactionId } = req.body;
    
    if (!nafathId || !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Nafath ID and transaction ID are required'
      });
    }
    
    // Nafath API integration would go here
    // For now, return a structured response for future implementation
    res.status(200).json({
      success: true,
      message: 'Nafath authentication initiated',
      data: {
        transactionId,
        status: 'pending',
        redirectUrl: `/api/auth/nafath/callback?transaction=${transactionId}`
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Nafath callback
// @route   POST /api/auth/nafath/callback
// @access  Public
const nafathCallback = async (req, res, next) => {
  try {
    const { nafathId, userData } = req.body;

    // Find user by email or create new one
    let user = await User.findOne({ email: userData.email });

    if (user) {
      // Update existing user with Nafath data
      user.nafathId = nafathId;
      user.isNafathVerified = true;
      user.isVerified = true;
      await user.save();
    } else {
      // Create new user with Nafath data
      user = await User.create({
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        nafathId,
        isNafathVerified: true,
        isVerified: true,
        userType: 'customer',
        location: {
          city: userData.city || 'الرياض'
        }
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};