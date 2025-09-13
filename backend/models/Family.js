const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a product name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a product description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Please add a product category'],
    enum: [
      'food',
      'handicrafts',
      'textiles',
      'jewelry',
      'home_decor',
      'beauty',
      'clothing',
      'accessories',
      'art',
      'other'
    ]
  },
  price: {
    type: Number,
    required: [true, 'Please add a price']
  },
  images: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  preparationTime: {
    type: String, // e.g., "2-3 days", "1 week"
    required: [true, 'Please add preparation time']
  },
  customizable: {
    type: Boolean,
    default: false
  },
  ingredients: [{
    type: String
  }],
  materials: [{
    type: String
  }],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

const certificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add certification name'],
    trim: true
  },
  issuedBy: {
    type: String,
    required: [true, 'Please add issuing authority']
  },
  issuedDate: {
    type: Date,
    required: [true, 'Please add issue date']
  },
  expiryDate: {
    type: Date
  },
  certificateNumber: {
    type: String
  },
  documentUrl: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  addedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

const familySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a family business name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  specialty: {
    type: String,
    required: [true, 'Please add a specialty'],
    enum: [
      'traditional_food',
      'baked_goods',
      'handicrafts',
      'textiles',
      'jewelry',
      'home_decor',
      'beauty_products',
      'clothing',
      'art',
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
    whatsapp: {
      type: String
    }
  },
  workingHours: {
    type: String,
    default: 'By appointment'
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
  products: [productSchema],
  certifications: [certificationSchema],
  socialMedia: {
    facebook: String,
    instagram: String,
    twitter: String,
    snapchat: String,
    tiktok: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  deliveryOptions: {
    pickup: {
      type: Boolean,
      default: true
    },
    delivery: {
      type: Boolean,
      default: false
    },
    shipping: {
      type: Boolean,
      default: false
    },
    deliveryRadius: {
      type: Number, // in kilometers
      default: 0
    },
    deliveryFee: {
      type: Number,
      default: 0
    }
  },
  paymentMethods: [{
    type: String,
    enum: [
      'cash',
      'bank_transfer',
      'credit_card',
      'mada',
      'apple_pay',
      'stc_pay',
      'urpay'
    ]
  }],
  businessLicense: {
    number: String,
    issuedDate: Date,
    expiryDate: Date,
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  familyMembers: {
    type: Number,
    min: 1,
    default: 1
  },
  yearsOfExperience: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Create index for location-based queries
familySchema.index({ location: '2dsphere' });

// Virtual for available products
familySchema.virtual('availableProducts').get(function() {
  return this.products.filter(product => product.isAvailable);
});

// Virtual for valid certifications
familySchema.virtual('validCertifications').get(function() {
  const now = new Date();
  return this.certifications.filter(cert => 
    !cert.expiryDate || cert.expiryDate > now
  );
});

module.exports = mongoose.model('Family', familySchema);