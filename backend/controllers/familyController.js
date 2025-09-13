const Family = require('../models/Family');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const geocoder = require('../utils/geocoder');

// @desc    Get all families
// @route   GET /api/families
// @access  Public
const getFamilies = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, specialty, search, sortBy = 'createdAt' } = req.query;
  
  let query = { isActive: true };
  
  // Filter by specialty
  if (specialty) {
    query.specialty = specialty;
  }
  
  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'familyInfo.familyName': { $regex: search, $options: 'i' } },
      { specialty: { $regex: search, $options: 'i' } }
    ];
  }
  
  const families = await Family.find(query)
    .populate('owner', 'name email phone')
    .sort({ [sortBy]: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
    
  const total = await Family.countDocuments(query);
  
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
  const family = await Family.findById(req.params.id)
    .populate('owner', 'name email phone')
    .populate('products')
    .populate('certifications');
    
  if (!family) {
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
  
  const families = await Family.find({
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
  
  const families = await Family.find({ specialty, isActive: true })
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .exec();
    
  const total = await Family.countDocuments({ specialty, isActive: true });
  
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
  const user = await User.findById(req.user.id);
  
  if (!user.familyInfo || !user.familyInfo.familyId) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  const family = await Family.findByIdAndUpdate(
    user.familyInfo.familyId,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    success: true,
    data: family
  });
});

// @desc    Delete family
// @route   DELETE /api/families/:id
// @access  Private (Family owner or Admin)
const deleteFamily = asyncHandler(async (req, res, next) => {
  const family = await Family.findById(req.params.id);
  
  if (!family) {
    return next(new ErrorResponse('Family not found', 404));
  }
  
  // Check if user owns the family or is admin
  if (family.owner.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this family', 403));
  }
  
  await family.remove();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Upload family images
// @route   PUT /api/families/upload
// @access  Private (Family owner)
const uploadFamilyImages = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.familyInfo || !user.familyInfo.familyId) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  // Handle image upload logic here
  // This would typically involve multer middleware and cloud storage
  
  res.status(200).json({
    success: true,
    message: 'Images uploaded successfully'
  });
});

// @desc    Add product
// @route   POST /api/families/products
// @access  Private (Family owner)
const addProduct = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.familyInfo || !user.familyInfo.familyId) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  const family = await Family.findById(user.familyInfo.familyId);
  
  const product = {
    ...req.body,
    family: family._id,
    createdBy: req.user.id
  };
  
  family.products.push(product);
  await family.save();
  
  res.status(201).json({
    success: true,
    data: product
  });
});

// @desc    Update product
// @route   PUT /api/families/products/:productId
// @access  Private (Family owner)
const updateProduct = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.familyInfo || !user.familyInfo.familyId) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  const family = await Family.findById(user.familyInfo.familyId);
  const product = family.products.id(req.params.productId);
  
  if (!product) {
    return next(new ErrorResponse('Product not found', 404));
  }
  
  Object.assign(product, req.body);
  await family.save();
  
  res.status(200).json({
    success: true,
    data: product
  });
});

// @desc    Delete product
// @route   DELETE /api/families/products/:productId
// @access  Private (Family owner)
const deleteProduct = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.familyInfo || !user.familyInfo.familyId) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  const family = await Family.findById(user.familyInfo.familyId);
  family.products.pull(req.params.productId);
  await family.save();
  
  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Get family products
// @route   GET /api/families/:id/products
// @access  Public
const getFamilyProducts = asyncHandler(async (req, res, next) => {
  const family = await Family.findById(req.params.id).select('products');
  
  if (!family) {
    return next(new ErrorResponse('Family not found', 404));
  }
  
  res.status(200).json({
    success: true,
    count: family.products.length,
    data: family.products
  });
});

// @desc    Add certification
// @route   POST /api/families/certifications
// @access  Private (Family owner)
const addCertification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.familyInfo || !user.familyInfo.familyId) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  const family = await Family.findById(user.familyInfo.familyId);
  
  const certification = {
    ...req.body,
    addedBy: req.user.id,
    addedAt: new Date()
  };
  
  family.certifications.push(certification);
  await family.save();
  
  res.status(201).json({
    success: true,
    data: certification
  });
});

// @desc    Remove certification
// @route   DELETE /api/families/certifications/:certId
// @access  Private (Family owner)
const removeCertification = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  
  if (!user.familyInfo || !user.familyInfo.familyId) {
    return next(new ErrorResponse('Family not found for this user', 404));
  }
  
  const family = await Family.findById(user.familyInfo.familyId);
  family.certifications.pull(req.params.certId);
  await family.save();
  
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