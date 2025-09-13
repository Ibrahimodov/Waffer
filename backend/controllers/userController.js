const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, userType, search, sortBy = 'createdAt' } = req.query;
  
  let query = {};
  
  // Filter by user type
  if (userType) {
    query.userType = userType;
  }
  
  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }
  
  const users = await User.find(query)
    .select('-password')
    .sort({ [sortBy]: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
    
  const total = await User.countDocuments(query);
  
  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: users
  });
});

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin or own profile)
const getUser = asyncHandler(async (req, res, next) => {
  // Check if user is accessing their own profile or is admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to access this profile', 403));
  }
  
  const user = await User.findById(req.params.id).select('-password');
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone
  };
  
  // Remove undefined fields
  Object.keys(fieldsToUpdate).forEach(key => {
    if (fieldsToUpdate[key] === undefined) {
      delete fieldsToUpdate[key];
    }
  });
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    fieldsToUpdate,
    {
      new: true,
      runValidators: true
    }
  ).select('-password');
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin or own profile)
const deleteUser = asyncHandler(async (req, res, next) => {
  // Check if user is deleting their own profile or is admin
  if (req.user.id !== req.params.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this profile', 403));
  }
  
  const user = await User.findById(req.params.id);
  
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  await user.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload user avatar
// @route   PUT /api/users/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res, next) => {
  // Handle avatar upload logic here
  // This would typically involve multer middleware and cloud storage
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: req.body.avatarUrl }, // Assuming the URL is provided after upload
    {
      new: true,
      runValidators: true
    }
  ).select('-password');
  
  res.status(200).json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: user
  });
});

// @desc    Update user location
// @route   PUT /api/users/location
// @access  Private
const updateLocation = asyncHandler(async (req, res, next) => {
  const { latitude, longitude, address, city, region } = req.body;
  
  if (!latitude || !longitude) {
    return next(new ErrorResponse('Please provide latitude and longitude', 400));
  }
  
  const locationData = {
    type: 'Point',
    coordinates: [longitude, latitude],
    address,
    city,
    region
  };
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { location: locationData },
    {
      new: true,
      runValidators: true
    }
  ).select('-password');
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update business info
// @route   PUT /api/users/business-info
// @access  Private (Shop owners only)
const updateBusinessInfo = asyncHandler(async (req, res, next) => {
  if (req.user.userType !== 'shop') {
    return next(new ErrorResponse('Only shop owners can update business info', 403));
  }
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { businessInfo: req.body },
    {
      new: true,
      runValidators: true
    }
  ).select('-password');
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update family info
// @route   PUT /api/users/family-info
// @access  Private (Productive families only)
const updateFamilyInfo = asyncHandler(async (req, res, next) => {
  if (req.user.userType !== 'productive_family') {
    return next(new ErrorResponse('Only productive families can update family info', 403));
  }
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { familyInfo: req.body },
    {
      new: true,
      runValidators: true
    }
  ).select('-password');
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update notification settings
// @route   PUT /api/users/notifications
// @access  Private
const updateNotificationSettings = asyncHandler(async (req, res, next) => {
  const { emailNotifications, pushNotifications, smsNotifications } = req.body;
  
  const notificationSettings = {
    email: emailNotifications !== undefined ? emailNotifications : req.user.notificationSettings?.email,
    push: pushNotifications !== undefined ? pushNotifications : req.user.notificationSettings?.push,
    sms: smsNotifications !== undefined ? smsNotifications : req.user.notificationSettings?.sms
  };
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { notificationSettings },
    {
      new: true,
      runValidators: true
    }
  ).select('-password');
  
  res.status(200).json({
    success: true,
    data: user
  });
});

module.exports = {
  getUsers,
  getUser,
  updateProfile,
  deleteUser,
  uploadAvatar,
  updateLocation,
  updateBusinessInfo,
  updateFamilyInfo,
  updateNotificationSettings
};