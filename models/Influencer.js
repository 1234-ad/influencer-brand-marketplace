const mongoose = require('mongoose');

const socialAccountSchema = new mongoose.Schema({
  platform: {
    type: String,
    enum: ['instagram', 'youtube', 'tiktok', 'twitter'],
    required: true
  },
  username: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  followerCount: {
    type: Number,
    default: 0
  },
  engagementRate: {
    type: Number,
    default: 0
  },
  verified: {
    type: Boolean,
    default: false
  }
});

const kycDocumentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['passport', 'driving_license', 'national_id'],
    required: true
  },
  documentUrl: {
    type: String,
    required: true
  },
  verified: {
    type: Boolean,
    default: false
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const influencerSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    maxlength: 500
  },
  profilePicture: {
    type: String
  },
  niche: [{
    type: String,
    enum: ['fashion', 'beauty', 'fitness', 'food', 'travel', 'tech', 'lifestyle', 'gaming', 'education', 'business']
  }],
  location: {
    country: String,
    city: String
  },
  socialAccounts: [socialAccountSchema],
  kycDocuments: [kycDocumentSchema],
  status: {
    type: String,
    enum: ['pending_verification', 'approved', 'rejected'],
    default: 'pending_verification'
  },
  popularityTrend: {
    type: String,
    enum: ['rising', 'stable', 'declining'],
    default: 'stable'
  },
  totalFollowers: {
    type: Number,
    default: 0
  },
  averageEngagement: {
    type: Number,
    default: 0
  },
  completedCampaigns: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  rejectionReason: String,
  approvedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calculate total followers from all social accounts
influencerSchema.methods.calculateTotalFollowers = function() {
  this.totalFollowers = this.socialAccounts.reduce((total, account) => {
    return total + account.followerCount;
  }, 0);
};

// Calculate average engagement rate
influencerSchema.methods.calculateAverageEngagement = function() {
  if (this.socialAccounts.length === 0) {
    this.averageEngagement = 0;
    return;
  }
  
  const totalEngagement = this.socialAccounts.reduce((total, account) => {
    return total + account.engagementRate;
  }, 0);
  
  this.averageEngagement = totalEngagement / this.socialAccounts.length;
};

// Update timestamp on save
influencerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  this.calculateTotalFollowers();
  this.calculateAverageEngagement();
  next();
});

module.exports = mongoose.model('Influencer', influencerSchema);