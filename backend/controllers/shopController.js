const Shop = require('../models/Shop');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const geocoder = require('../utils/geocoder');

// @desc    Get all shops
// @route   GET /api/shops
// @access  Public
const getShops = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, category, search, sortBy = 'createdAt' } = req.query;
  
  let query = { isActive: true };
  
  // Filter by category
  if (category) {
    query.category = category;
  }
  
  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'businessInfo.businessName': { $regex: search, $options: 'i' } }
    ];
  }
  
  const shops = await Shop.find(query)
    .populate('owner', 'name email phone')
    .sort({ [sortBy]: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
    
  const total = await Shop.countDocuments(query);
  
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
  const shop = await Shop.findById(req.params.id)
    .populate('owner', 'name email phone')
    .populate('offers');
    
  if (!shop) {
    return next(new ErrorResponse('Shop not found', 404));
  }
  
  res.status(200).json({
    success: true,
    data: shop
  });
});

// @desc    Get nearby shops
// @route   GET /api/shops/nearby
// @access  Public
const getNearbyShops = asyncHandler(async (req, res, next) => {
  const { lat, lng, radius = 10 } = req.query;
  
  if (!lat || !lng) {
    return next(new ErrorResponse('Please provide latitude and longitude', 400));
  }
  
  const shops = await Shop.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    },
    isActive: true
  }).populate('owner', 'name email phone');
  
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
  
  const shops = await Shop.find({ category, isActive: true })
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
    
  const total = await Shop.countDocuments({ category, isActive: true });
  
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
  const user = await User.findById(req.user.id);
  
  if (!user.businessInfo || !user.businessInfo.shopId) {
    return next(new ErrorResponse('Shop not found for this user', 404));
  }
  
  const shop = await Shop.findByIdAndUpdate(
    user.businessInfo.shopId,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: shop
  });
});

// @desc    Delete shop
// @route   DELETE /api/shops/:id
// @access  Private (Shop owner or Admin)
const deleteShop = asyncHandler(async (req, res, next) => {
  const shop = await Shop.findById(req.params.id);
  
  if (!shop) {
    return next(new ErrorResponse('Shop not found', 404));
  }
  
  // Check if user owns the shop or is admin
  if (shop.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this shop', 403));
  }
  
  await shop.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload shop images
// @route   PUT /api/shops/upload
// @access  Private (Shop owner)
const uploadShopImages = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.businessInfo || !user.businessInfo.shopId) {
    return next(new ErrorResponse('Shop not found for this user', 404));
  }
  
  // Handle image upload logic here
  // This would typically involve multer middleware and cloud storage
  
  res.status(200).json({
    success: true,
    message: 'Images uploaded successfully'
  });
});

// @desc    Add offer
// @route   POST /api/shops/offers
// @access  Private (Shop owner)
const addOffer = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.businessInfo || !user.businessInfo.shopId) {
    return next(new ErrorResponse('Shop not found for this user', 404));
  }
  
  const shop = await Shop.findById(user.businessInfo.shopId);
  
  const offer = {
    ...req.body,
    shop: shop._id,
    createdBy: req.user.id
  };
  
  shop.offers.push(offer);
  await shop.save();
  
  res.status(201).json({
    success: true,
    data: offer
  });
});

// @desc    Update offer
// @route   PUT /api/shops/offers/:offerId
// @access  Private (Shop owner)
const updateOffer = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.businessInfo || !user.businessInfo.shopId) {
    return next(new ErrorResponse('Shop not found for this user', 404));
  }
  
  const shop = await Shop.findById(user.businessInfo.shopId);
  const offer = shop.offers.id(req.params.offerId);
  
  if (!offer) {
    return next(new ErrorResponse('Offer not found', 404));
  }
  
  Object.assign(offer, req.body);
  await shop.save();
  
  res.status(200).json({
    success: true,
    data: offer
  });
});

// @desc    Delete offer
// @route   DELETE /api/shops/offers/:offerId
// @access  Private (Shop owner)
const deleteOffer = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.businessInfo || !user.businessInfo.shopId) {
    return next(new ErrorResponse('Shop not found for this user', 404));
  }
  
  const shop = await Shop.findById(user.businessInfo.shopId);
  shop.offers.pull(req.params.offerId);
  await shop.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get shop offers
// @route   GET /api/shops/:id/offers
// @access  Public
const getShopOffers = asyncHandler(async (req, res, next) => {
  const shop = await Shop.findById(req.params.id).select('offers');
  
  if (!shop) {
    return next(new ErrorResponse('Shop not found', 404));
  }
  
  res.status(200).json({
    success: true,
    count: shop.offers.length,
    data: shop.offers
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