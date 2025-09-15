const { createClient } = require('@supabase/supabase-js');
const { getSupabase } = require('../config/database');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const geocoder = require('../utils/geocoder');

// @desc    Get all families
// @route   GET /api/families
// @access  Public
const getFamilies = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, specialty, search, sortBy = 'created_at' } = req.query;
  
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Build query
  let query = supabaseAdmin
    .from('families')
    .select(`
      *,
      users!families_user_id_fkey(
        id,
        name,
        email,
        phone
      )
    `)
    .eq('is_active', true);
  
  // Filter by specialty
  if (specialty) {
    query = query.eq('specialty', specialty);
  }
  
  // Search functionality
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,specialty.ilike.%${search}%`);
  }
  
  // Sort
  const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy;
  query = query.order(sortColumn, { ascending: false });
  
  // Get total count
  let countQuery = supabaseAdmin
    .from('families')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  if (specialty) {
    countQuery = countQuery.eq('specialty', specialty);
  }
  
  if (search) {
    countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%,specialty.ilike.%${search}%`);
  }
  
  const { count: total } = await countQuery;
  
  // Apply pagination
  query = query.range(startIndex, endIndex - 1);
  
  // Execute query
  const { data: families, error } = await query;
  
  if (error) {
    return next(new ErrorResponse('Error fetching families', 500));
  }
  
  res.status(200).json({
    success: true,
    count: families.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: families
  });
});

// @desc    Get single family
// @route   GET /api/families/:id
// @access  Public
const getFamily = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data: family, error } = await supabaseAdmin
    .from('families')
    .select(`
      *,
      users!families_user_id_fkey(
        id,
        name,
        email,
        phone
      )
    `)
    .eq('id', req.params.id)
    .single();
    
  if (error || !family) {
    return next(new ErrorResponse('Family not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: family
  });
});

// @desc    Get nearby families
// @route   GET /api/families/nearby
// @access  Public
const getNearbyFamilies = asyncHandler(async (req, res, next) => {
  const { lat, lng, radius = 10 } = req.query;
  
  if (!lat || !lng) {
    return next(new ErrorResponse('Please provide latitude and longitude', 400));
  }
  
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Convert radius from km to meters for PostGIS
  const radiusInMeters = radius * 1000;
  
  // Use PostGIS function for geospatial query
  const { data: families, error } = await supabaseAdmin
    .from('families')
    .select(`
      *,
      users!families_user_id_fkey(
        id,
        name,
        email,
        phone
      )
    `)
    .eq('is_active', true)
    .rpc('families_within_distance', {
      lat: lat,
      lng: lng,
      distance_meters: radiusInMeters
    });
  
  if (error) {
    return next(new ErrorResponse('Error fetching nearby families', 500));
  }
  
  res.status(200).json({
    success: true,
    count: families.length,
    data: families
  });
});

// @desc    Get families by specialty
// @route   GET /api/families/specialty/:specialty
// @access  Public
const getFamiliesBySpecialty = asyncHandler(async (req, res, next) => {
  const { specialty } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Get families by specialty
  const { data: families, error } = await supabaseAdmin
    .from('families')
    .select(`
      *,
      users!families_user_id_fkey(
        id,
        name,
        email,
        phone
      )
    `)
    .eq('specialty', specialty)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(startIndex, endIndex - 1);
  
  if (error) {
    return next(new ErrorResponse('Error fetching families by specialty', 500));
  }
  
  // Get total count
  const { count: total } = await supabaseAdmin
    .from('families')
    .select('*', { count: 'exact', head: true })
    .eq('specialty', specialty)
    .eq('is_active', true);
  
  res.status(200).json({
    success: true,
    count: families.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: families
  });
});

// @desc    Update family profile
// @route   PUT /api/families/profile
// @access  Private (Family owner)
const updateFamilyProfile = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get user's family
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('family_id')
    .eq('id', req.user.id)
    .single();
  
  if (userError || !user || !user.family_id) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  // Update the family
  const { data: family, error: updateError } = await supabaseAdmin
    .from('families')
    .update({
      ...req.body,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.family_id)
    .select()
    .single();
  
  if (updateError) {
    return next(new ErrorResponse('Error updating family profile', 500));
  }
  
  res.status(200).json({
    success: true,
    data: family
  });
});

// @desc    Delete family
// @route   DELETE /api/families/:id
// @access  Private (Family owner or Admin)
const deleteFamily = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // First, get the family to check ownership
  const { data: family, error: fetchError } = await supabaseAdmin
    .from('families')
    .select('*')
    .eq('id', req.params.id)
    .single();
  
  if (fetchError || !family) {
    return next(new ErrorResponse('Family not found', 404));
  }
  
  // Check if user owns the family or is admin
  if (family.user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this family', 403));
  }
  
  // Delete the family
  const { error: deleteError } = await supabaseAdmin
    .from('families')
    .delete()
    .eq('id', req.params.id);
  
  if (deleteError) {
    return next(new ErrorResponse('Error deleting family', 500));
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload family images
// @route   PUT /api/families/upload
// @access  Private (Family owner)
const uploadFamilyImages = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get user's family
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('family_id')
    .eq('id', req.user.id)
    .single();
  
  if (userError || !user || !user.family_id) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  if (!req.files) {
    return next(new ErrorResponse('Please upload files', 400));
  }
  
  const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
  const imageUrls = [];
  
  // Process each file
  for (let file of files) {
    // Create custom filename
    const fileName = `family_${user.family_id}_${Date.now()}_${file.name}`;
    
    try {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('family-images')
        .upload(fileName, file.data, {
          contentType: file.mimetype,
          upsert: false
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        return next(new ErrorResponse('Problem with file upload', 500));
      }
      
      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from('family-images')
        .getPublicUrl(fileName);
      
      imageUrls.push(publicUrl);
    } catch (error) {
      console.error('File processing error:', error);
      return next(new ErrorResponse('Problem with file upload', 500));
    }
  }
  
  // Update family with image URLs
  const { data: family, error: fetchError } = await supabaseAdmin
    .from('families')
    .select('images')
    .eq('id', user.family_id)
    .single();
  
  const currentImages = family?.images || [];
  const { error: updateError } = await supabaseAdmin
    .from('families')
    .update({
      images: [...currentImages, ...imageUrls],
      updated_at: new Date().toISOString()
    })
    .eq('id', user.family_id);
  
  if (updateError) {
    return next(new ErrorResponse('Error updating family images', 500));
  }
  
  res.status(200).json({
    success: true,
    data: imageUrls
  });
});

// @desc    Add product
// @route   POST /api/families/products
// @access  Private (Family owner)
const addProduct = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get user's family
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('family_id')
    .eq('id', req.user.id)
    .single();
  
  if (userError || !user || !user.family_id) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  // Create the product
  const { data: product, error: productError } = await supabaseAdmin
    .from('products')
    .insert({
      ...req.body,
      family_id: user.family_id,
      created_by: req.user.id,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (productError) {
    return next(new ErrorResponse('Error creating product', 500));
  }
  
  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Update product
// @route   PUT /api/families/products/:productId
// @access  Private (Family owner)
const updateProduct = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get user's family
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('family_id')
    .eq('id', req.user.id)
    .single();
  
  if (userError || !user || !user.family_id) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  // Check if product exists and belongs to user's family
  const { data: existingProduct, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', req.params.productId)
    .eq('family_id', user.family_id)
    .single();
  
  if (fetchError || !existingProduct) {
    return next(new ErrorResponse('Product not found', 404));
  }
  
  // Update the product
  const { data: product, error: updateError } = await supabaseAdmin
    .from('products')
    .update({
      ...req.body,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.params.productId)
    .select()
    .single();
  
  if (updateError) {
    return next(new ErrorResponse('Error updating product', 500));
  }
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Delete product
// @route   DELETE /api/families/products/:productId
// @access  Private (Family owner)
const deleteProduct = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get user's family
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('family_id')
    .eq('id', req.user.id)
    .single();
  
  if (userError || !user || !user.family_id) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  // Check if product exists and belongs to user's family
  const { data: existingProduct, error: fetchError } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('id', req.params.productId)
    .eq('family_id', user.family_id)
    .single();
  
  if (fetchError || !existingProduct) {
    return next(new ErrorResponse('Product not found', 404));
  }
  
  // Delete the product
  const { error: deleteError } = await supabaseAdmin
    .from('products')
    .delete()
    .eq('id', req.params.productId);
  
  if (deleteError) {
    return next(new ErrorResponse('Error deleting product', 500));
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get family products
// @route   GET /api/families/:id/products
// @access  Public
const getFamilyProducts = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Check if family exists
  const { data: family, error: familyError } = await supabaseAdmin
    .from('families')
    .select('id')
    .eq('id', req.params.id)
    .single();
  
  if (familyError || !family) {
    return next(new ErrorResponse('Family not found', 404));
  }
  
  // Get products for the family
  const { data: products, error: productsError } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('family_id', req.params.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (productsError) {
    return next(new ErrorResponse('Error fetching products', 500));
  }
  
  res.status(200).json({
    success: true,
    count: products.length,
    data: products
  });
});

// @desc    Add certification
// @route   POST /api/families/certifications
// @access  Private (Family owner)
const addCertification = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get user's family
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('family_id')
    .eq('id', req.user.id)
    .single();
  
  if (userError || !user || !user.family_id) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  // Create the certification
  const { data: certification, error: certError } = await supabaseAdmin
    .from('certifications')
    .insert({
      ...req.body,
      family_id: user.family_id,
      added_by: req.user.id,
      added_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (certError) {
    return next(new ErrorResponse('Error adding certification', 500));
  }
  
  res.status(201).json({
    success: true,
    data: certification
  });
});

// @desc    Remove certification
// @route   DELETE /api/families/certifications/:certId
// @access  Private (Family owner)
const removeCertification = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get user's family
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('family_id')
    .eq('id', req.user.id)
    .single();
  
  if (userError || !user || !user.family_id) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  // Check if certification exists and belongs to user's family
  const { data: existingCert, error: fetchError } = await supabaseAdmin
    .from('certifications')
    .select('*')
    .eq('id', req.params.certId)
    .eq('family_id', user.family_id)
    .single();
  
  if (fetchError || !existingCert) {
    return next(new ErrorResponse('Certification not found', 404));
  }
  
  // Delete the certification
  const { error: deleteError } = await supabaseAdmin
    .from('certifications')
    .delete()
    .eq('id', req.params.certId);
  
  if (deleteError) {
    return next(new ErrorResponse('Error removing certification', 500));
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

module.exports = {
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
};