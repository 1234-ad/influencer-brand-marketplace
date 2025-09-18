const mongoose = require('mongoose');

const brandSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true
  },
  website: {
    type: String,
    required: true
  },
  industry: {
    type: String,
    required: true,
    enum: ['fashion', 'beauty', 'fitness', 'food', 'travel', 'tech', 'lifestyle', 'gaming', 'education', 'business', 'healthcare', 'automotive', 'finance']
  },
  description: {
    type: String,
    maxlength: 1000
  },
  logo: {
    type: String
  },
  contactPerson: {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    position: String,
    phone: String
  },
  location: {
    country: String,
    city: String,
    address: String
  },
  socialMedia: {
    instagram: String,
    facebook: String,
    twitter: String,
    linkedin: String
  },
  subscription: {
    plan: {
      type: String,
      enum: ['basic', 'premium', 'enterprise'],
      default: 'basic'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending'
    },
    startDate: Date,
    endDate: Date,
    paymentStatus: {
      type: String,
      enum: ['paid', 'pending', 'failed'],
      default: 'pending'
    }
  },
  campaignsCreated: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
brandSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Brand', brandSchema);