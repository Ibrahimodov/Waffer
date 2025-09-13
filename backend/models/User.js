const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^(\+966|0)?[5][0-9]{8}$/, 'Please enter a valid Saudi phone number']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  // User Type
  userType: {
    type: String,
    enum: ['customer', 'shop', 'productive_family'],
    required: [true, 'User type is required']
  },
  
  // Nafath Authentication
  nafathId: {
    type: String,
    unique: true,
    sparse: true
  },
  isNafathVerified: {
    type: Boolean,
    default: false
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  dateOfBirth: {
    type: Date
  },
  gender: {
    type: String,
    enum: ['male', 'female']
  },
  
  // Location
  location: {
    city: {
      type: String,
      required: [true, 'City is required']
    },
    district: {
      type: String
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  
  // Business Information (for shops and productive families)
  businessInfo: {
    businessName: {
      type: String,
      required: function() {
        return this.userType === 'shop' || this.userType === 'productive_family';
      }
    },
    commercialRegistration: {
      type: String,
      required: function() {
        return this.userType === 'shop';
      },
      unique: true,
      sparse: true
    },
    businessType: {
      type: String,
      enum: ['restaurant', 'retail', 'service', 'grocery', 'pharmacy', 'electronics', 'clothing', 'other']
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    workingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String }
    },
    socialMedia: {
      instagram: String,
      twitter: String,
      snapchat: String,
      whatsapp: String
    }
  },
  
  // Productive Family Specific
  familyInfo: {
    familySize: {
      type: Number,
      required: function() {
        return this.userType === 'productive_family';
      }
    },
    specialties: [{
      type: String,
      enum: ['food', 'handicrafts', 'textiles', 'beauty', 'education', 'other']
    }],
    certifications: [String]
  },
  
  // Account Status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  
  // Preferences
  language: {
    type: String,
    enum: ['ar', 'en'],
    default: 'ar'
  },
  notifications: {
    email: {
      type: Boolean,
      default: true
    },
    push: {
      type: Boolean,
      default: true
    },
    sms: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ 'location.city': 1 });
userSchema.index({ 'businessInfo.businessType': 1 });

// Virtual for full business name
userSchema.virtual('fullBusinessName').get(function() {
  if (this.userType === 'productive_family') {
    return `${this.businessInfo.businessName} - أسرة منتجة`;
  }
  return this.businessInfo.businessName;
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to generate verification token
userSchema.methods.generateVerificationToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.verificationToken = token;
  return token;
};

// Method to generate reset password token
userSchema.methods.generateResetPasswordToken = function() {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  this.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return resetToken;
};

module.exports = mongoose.model('User', userSchema);