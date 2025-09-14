const { createClient } = require('@supabase/supabase-js');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin only)
const getUsers = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { page = 1, limit = 10, userType, search, sortBy = 'created_at' } = req.query;
  
  let query = supabaseAdmin.from('users').select('*', { count: 'exact' });
  
  // Filter by user type
  if (userType) {
    query = query.eq('user_type', userType);
  }
  
  // Search functionality
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
  }
  
  // Apply sorting
  const sortOrder = sortBy === 'created_at' ? { ascending: false } : { ascending: true };
  query = query.order(sortBy, sortOrder);
  
  // Apply pagination
  const offset = (page - 1) * limit;
  query = query.range(offset, offset + limit - 1);
  
  const { data: users, error, count } = await query;
  
  if (error) {
    return next(new ErrorResponse('Error fetching users', 500));
  }
  
  res.status(200).json({
    success: true,
    count: users.length,
    total: count,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
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
  
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', req.params.id)
    .single();
  
  if (error || !user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Remove password hash from response
  delete user.password_hash;
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateProfile = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
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
  
  // Add updated timestamp
  fieldsToUpdate.updated_at = new Date().toISOString();
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update(fieldsToUpdate)
    .eq('id', req.user.id)
    .select()
    .single();
  
  if (error) {
    return next(new ErrorResponse('Error updating profile', 500));
  }
  
  // Remove password hash from response
  delete user.password_hash;
  
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
  
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Check if user exists
  const { data: user, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('id', req.params.id)
    .single();
  
  if (fetchError || !user) {
    return next(new ErrorResponse('User not found', 404));
  }
  
  // Delete the user
  const { error: deleteError } = await supabaseAdmin
    .from('users')
    .delete()
    .eq('id', req.params.id);
  
  if (deleteError) {
    return next(new ErrorResponse('Error deleting user', 500));
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload user avatar
// @route   PUT /api/users/avatar
// @access  Private
const uploadAvatar = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Handle avatar upload logic here
  // This would typically involve multer middleware and Supabase Storage
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update({ 
      avatar_url: req.body.avatarUrl, // Assuming the URL is provided after upload
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id)
    .select()
    .single();
  
  if (error) {
    return next(new ErrorResponse('Error updating avatar', 500));
  }
  
  // Remove password hash from response
  delete user.password_hash;
  
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
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { latitude, longitude, address, city, region } = req.body;
  
  if (!latitude || !longitude) {
    return next(new ErrorResponse('Please provide latitude and longitude', 400));
  }
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update({
      latitude,
      longitude,
      address,
      city,
      region,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id)
    .select()
    .single();
  
  if (error) {
    return next(new ErrorResponse('Error updating location', 500));
  }
  
  // Remove password hash from response
  delete user.password_hash;
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update business info
// @route   PUT /api/users/business-info
// @access  Private (Shop owners only)
const updateBusinessInfo = asyncHandler(async (req, res, next) => {
  if (req.user.user_type !== 'shop') {
    return next(new ErrorResponse('Only shop owners can update business info', 403));
  }
  
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update({
      business_name: req.body.businessName,
      business_description: req.body.businessDescription,
      business_category: req.body.businessCategory,
      business_license: req.body.businessLicense,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id)
    .select()
    .single();
  
  if (error) {
    return next(new ErrorResponse('Error updating business info', 500));
  }
  
  // Remove password hash from response
  delete user.password_hash;
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update family info
// @route   PUT /api/users/family-info
// @access  Private (Productive families only)
const updateFamilyInfo = asyncHandler(async (req, res, next) => {
  if (req.user.user_type !== 'productive_family') {
    return next(new ErrorResponse('Only productive families can update family info', 403));
  }
  
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update({
      family_size: req.body.familySize,
      family_specialty: req.body.familySpecialty,
      family_description: req.body.familyDescription,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id)
    .select()
    .single();
  
  if (error) {
    return next(new ErrorResponse('Error updating family info', 500));
  }
  
  // Remove password hash from response
  delete user.password_hash;
  
  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update notification settings
// @route   PUT /api/users/notifications
// @access  Private
const updateNotificationSettings = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { emailNotifications, pushNotifications, smsNotifications } = req.body;
  
  // Get current user to preserve existing notification settings
  const { data: currentUser, error: fetchError } = await supabaseAdmin
    .from('users')
    .select('email_notifications, push_notifications, sms_notifications')
    .eq('id', req.user.id)
    .single();
  
  if (fetchError) {
    return next(new ErrorResponse('Error fetching user data', 500));
  }
  
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update({
      email_notifications: emailNotifications !== undefined ? emailNotifications : currentUser.email_notifications,
      push_notifications: pushNotifications !== undefined ? pushNotifications : currentUser.push_notifications,
      sms_notifications: smsNotifications !== undefined ? smsNotifications : currentUser.sms_notifications,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.user.id)
    .select()
    .single();
  
  if (error) {
    return next(new ErrorResponse('Error updating notification settings', 500));
  }
  
  // Remove password hash from response
  delete user.password_hash;
  
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