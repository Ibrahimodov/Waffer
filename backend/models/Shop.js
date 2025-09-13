const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an offer title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add an offer description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  originalPrice: {
    type: Number,
    required: [true, 'Please add original price']
  },
  discountedPrice: {
    type: Number,
    required: [true, 'Please add discounted price']
  },
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100
  },
  validFrom: {
    type: Date,
    default: Date.now
  },
  validUntil: {
    type: Date,
    required: [true, 'Please add offer expiry date']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  images: [{
    type: String
  }],
  terms: {
    type: String,
    maxlength: [300, 'Terms cannot be more than 300 characters']
  },
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const shopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a shop name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: [
      'restaurant',
      'retail',
      'services',
      'healthcare',
      'automotive',
      'beauty',
      'electronics',
      'fashion',
      'home',
      'sports',
      'education',
      'other'
    ]
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      index: '2dsphere'
    },
    address: {
      type: String,
      required: [true, 'Please add an address']
    },
    city: {
      type: String,
      required: [true, 'Please add a city']
    },
    region: {
      type: String,
      required: [true, 'Please add a region']
    }
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Please add a phone number']
    },
    email: {
      type: String,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email'
      ]
    },
    website: {
      type: String
    }
  },
  businessHours: {
    monday: { open: String, close: String, closed: { type: Boolean, default: false } },
    tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
    thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
    friday: { open: String, close: String, closed: { type: Boolean, default: false } },
    saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
    sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
  },
  images: [{
    type: String
  }],
  logo: {
    type: String
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  offers: [offerSchema],
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    snapchat: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  features: [{
    type: String,
    enum: [
      'parking',
      'wifi',
      'delivery',
      'takeaway',
      'wheelchair_accessible',
      'air_conditioning',
      'outdoor_seating',
      'credit_cards',
      'cash_only',
      'reservations'
    ]
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create index for location-based queries
shopSchema.index({ location: '2dsphere' });

// Calculate discount percentage before saving
offerSchema.pre('save', function(next) {
  if (this.originalPrice && this.discountedPrice) {
    this.discountPercentage = Math.round(
      ((this.originalPrice - this.discountedPrice) / this.originalPrice) * 100
    );
  }
  next();
});

// Virtual for active offers
shopSchema.virtual('activeOffers').get(function() {
  return this.offers.filter(offer => 
    offer.isActive && 
    offer.validUntil > new Date()
  );
});

module.exports = mongoose.model('Shop', shopSchema);