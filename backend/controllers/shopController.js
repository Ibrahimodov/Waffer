const { createClient } = require('@supabase/supabase-js');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');
const geocoder = require('../utils/geocoder');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// @desc    Get all shops
// @route   GET /api/shops
// @access  Public
const getShops = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { page = 1, limit = 10, category, search, sortBy = 'created_at' } = req.query;
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Build query
  let query = supabaseAdmin
    .from('shops')
    .select(`
      *,
      users!shops_user_id_fkey(
        id,
        name,
        email,
        phone
      )
    `)
    .eq('is_active', true);
  
  // Filter by category
  if (category) {
    query = query.eq('category', category);
  }
  
  // Search functionality
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  
  // Sort
  const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy;
  query = query.order(sortColumn, { ascending: false });
  
  // Get total count
  let countQuery = supabaseAdmin
    .from('shops')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);
  
  if (category) {
    countQuery = countQuery.eq('category', category);
  }
  
  if (search) {
    countQuery = countQuery.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  
  const { count: total } = await countQuery;
  
  // Apply pagination
  query = query.range(startIndex, endIndex - 1);
  
  // Execute query
  const { data: shops, error } = await query;
  
  if (error) {
    return next(new ErrorResponse('Error fetching shops', 500));
  }
  
  res.status(200).json({
    success: true,
    count: shops.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: shops
  });
});

// @desc    Get single shop
// @route   GET /api/shops/:id
// @access  Public
const getShop = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  const { data: shop, error } = await supabaseAdmin
    .from('shops')
    .select(`
      *,
      users!shops_user_id_fkey(
        id,
        name,
        email
      )
    `)
    .eq('id', req.params.id)
    .single();
  
  if (error || !shop) {
    return next(new ErrorResponse(`Shop not found with id of ${req.params.id}`, 404));
  }
  
  res.status(200).json({
    success: true,
    data: shop
  });
});

// @desc    Get shops within a radius
// @route   GET /api/shops/radius/:zipcode/:distance
// @access  Public
const getNearbyShops = asyncHandler(async (req, res, next) => {
  const { zipcode, distance } = req.params;
  
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;
  
  // Convert distance from miles to meters for PostGIS
  const distanceInMeters = distance * 1609.34;
  
  // Use PostGIS ST_DWithin function for geospatial query
  const { data: shops, error } = await supabaseAdmin
    .from('shops')
    .select(`
      *,
      users!shops_user_id_fkey(
        id,
        name,
        email
      )
    `)
    .eq('is_active', true)
    .rpc('shops_within_distance', {
      lat: lat,
      lng: lng,
      distance_meters: distanceInMeters
    });
  
  if (error) {
    return next(new ErrorResponse('Error fetching nearby shops', 500));
  }
  
  res.status(200).json({
    success: true,
    count: shops.length,
    data: shops
  });
});

// @desc    Get shops by category
// @route   GET /api/shops/category/:category
// @access  Public
const getShopsByCategory = asyncHandler(async (req, res, next) => {
  const { category } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Pagination
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  
  // Get shops by category
  const { data: shops, error } = await supabaseAdmin
    .from('shops')
    .select(`
      *,
      users!shops_user_id_fkey(
        id,
        name,
        email,
        phone
      )
    `)
    .eq('category', category)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .range(startIndex, endIndex - 1);
  
  if (error) {
    return next(new ErrorResponse('Error fetching shops by category', 500));
  }
  
  // Get total count
  const { count: total } = await supabaseAdmin
    .from('shops')
    .select('*', { count: 'exact', head: true })
    .eq('category', category)
    .eq('is_active', true);
  
  res.status(200).json({
    success: true,
    count: shops.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: shops
  });
});

// @desc    Update shop profile
// @route   PUT /api/shops/profile
// @access  Private (Shop owner)
const updateShopProfile = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get user's shop
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('shop_id')
    .eq('id', req.user.id)
    .single();
  
  if (userError || !user || !user.shop_id) {
    return next(new ErrorResponse('Shop not found for this user', 404));
  }
  
  // Update the shop
  const { data: shop, error: updateError } = await supabaseAdmin
    .from('shops')
    .update({
      ...req.body,
      updated_at: new Date().toISOString()
    })
    .eq('id', user.shop_id)
    .select()
    .single();
  
  if (updateError) {
    return next(new ErrorResponse('Error updating shop profile', 500));
  }
  
  res.status(200).json({
    success: true,
    data: shop
  });
});

// @desc    Delete shop
// @route   DELETE /api/shops/:id
// @access  Private (Shop owner or Admin)
const deleteShop = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // First, get the shop to check ownership
  const { data: shop, error: fetchError } = await supabaseAdmin
    .from('shops')
    .select('*')
    .eq('id', req.params.id)
    .single();
  
  if (fetchError || !shop) {
    return next(new ErrorResponse(`Shop not found with id of ${req.params.id}`, 404));
  }
  
  // Check if user owns the shop or is admin
  if (shop.user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this shop', 403));
  }
  
  // Delete the shop
  const { error: deleteError } = await supabaseAdmin
    .from('shops')
    .delete()
    .eq('id', req.params.id);
  
  if (deleteError) {
    return next(new ErrorResponse('Error deleting shop', 500));
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload shop images
// @route   PUT /api/shops/:id/images
// @access  Private (Shop owner)
const uploadShopImages = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // First, get the shop to check ownership
  const { data: shop, error: fetchError } = await supabaseAdmin
    .from('shops')
    .select('*')
    .eq('id', req.params.id)
    .single();
  
  if (fetchError || !shop) {
    return next(new ErrorResponse(`Shop not found with id of ${req.params.id}`, 404));
  }
  
  // Make sure user is shop owner
  if (shop.user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse(`User ${req.user.id} is not authorized to update this shop`, 401));
  }
  
  if (!req.files) {
    return next(new ErrorResponse(`Please upload files`, 400));
  }
  
  const files = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
  const imageUrls = [];
  
  // Process each file
  for (let file of files) {
    // Create custom filename
    const fileName = `shop_${shop.id}_${Date.now()}_${file.name}`;
    
    try {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('shop-images')
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
        .from('shop-images')
        .getPublicUrl(fileName);
      
      imageUrls.push(publicUrl);
    } catch (error) {
      console.error('File processing error:', error);
      return next(new ErrorResponse('Problem with file upload', 500));
    }
  }
  
  // Update shop with image URLs
  const currentImages = shop.images || [];
  const { error: updateError } = await supabaseAdmin
    .from('shops')
    .update({
      images: [...currentImages, ...imageUrls],
      updated_at: new Date().toISOString()
    })
    .eq('id', req.params.id);
  
  if (updateError) {
    return next(new ErrorResponse('Error updating shop images', 500));
  }
  
  res.status(200).json({
    success: true,
    data: imageUrls
  });
});

// @desc    Add offer
// @route   POST /api/shops/offers
// @access  Private (Shop owner)
const addOffer = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get user's shop
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('shop_id')
    .eq('id', req.user.id)
    .single();
  
  if (userError || !user || !user.shop_id) {
    return next(new ErrorResponse('Shop not found for this user', 404));
  }
  
  // Create the offer
  const { data: offer, error: offerError } = await supabaseAdmin
    .from('offers')
    .insert({
      ...req.body,
      shop_id: user.shop_id,
      created_by: req.user.id,
      created_at: new Date().toISOString()
    })
    .select()
    .single();
  
  if (offerError) {
    return next(new ErrorResponse('Error creating offer', 500));
  }
  
  res.status(201).json({
    success: true,
    data: offer
  });
});

// @desc    Update offer
// @route   PUT /api/shops/offers/:offerId
// @access  Private (Shop owner)
const updateOffer = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get user's shop
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('shop_id')
    .eq('id', req.user.id)
    .single();
  
  if (userError || !user || !user.shop_id) {
    return next(new ErrorResponse('Shop not found for this user', 404));
  }
  
  // Check if offer exists and belongs to user's shop
  const { data: existingOffer, error: fetchError } = await supabaseAdmin
    .from('offers')
    .select('*')
    .eq('id', req.params.offerId)
    .eq('shop_id', user.shop_id)
    .single();
  
  if (fetchError || !existingOffer) {
    return next(new ErrorResponse('Offer not found', 404));
  }
  
  // Update the offer
  const { data: offer, error: updateError } = await supabaseAdmin
    .from('offers')
    .update({
      ...req.body,
      updated_at: new Date().toISOString()
    })
    .eq('id', req.params.offerId)
    .select()
    .single();
  
  if (updateError) {
    return next(new ErrorResponse('Error updating offer', 500));
  }
  
  res.status(200).json({
    success: true,
    data: offer
  });
});

// @desc    Delete offer
// @route   DELETE /api/shops/offers/:offerId
// @access  Private (Shop owner)
const deleteOffer = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Get user's shop
  const { data: user, error: userError } = await supabaseAdmin
    .from('users')
    .select('shop_id')
    .eq('id', req.user.id)
    .single();
  
  if (userError || !user || !user.shop_id) {
    return next(new ErrorResponse('Shop not found for this user', 404));
  }
  
  // Check if offer exists and belongs to user's shop
  const { data: existingOffer, error: fetchError } = await supabaseAdmin
    .from('offers')
    .select('*')
    .eq('id', req.params.offerId)
    .eq('shop_id', user.shop_id)
    .single();
  
  if (fetchError || !existingOffer) {
    return next(new ErrorResponse('Offer not found', 404));
  }
  
  // Delete the offer
  const { error: deleteError } = await supabaseAdmin
    .from('offers')
    .delete()
    .eq('id', req.params.offerId);
  
  if (deleteError) {
    return next(new ErrorResponse('Error deleting offer', 500));
  }
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get shop offers
// @route   GET /api/shops/:id/offers
// @access  Public
const getShopOffers = asyncHandler(async (req, res, next) => {
  // Initialize Supabase client with service role for admin operations
  const supabaseAdmin = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Check if shop exists
  const { data: shop, error: shopError } = await supabaseAdmin
    .from('shops')
    .select('id')
    .eq('id', req.params.id)
    .single();
  
  if (shopError || !shop) {
    return next(new ErrorResponse('Shop not found', 404));
  }
  
  // Get offers for the shop
  const { data: offers, error: offersError } = await supabaseAdmin
    .from('offers')
    .select('*')
    .eq('shop_id', req.params.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  
  if (offersError) {
    return next(new ErrorResponse('Error fetching offers', 500));
  }
  
  res.status(200).json({
    success: true,
    count: offers.length,
    data: offers
  });
});

module.exports = {
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
};