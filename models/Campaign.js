const mongoose = require('mongoose');

const deliverableSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['post', 'story', 'reel', 'video', 'blog'],
    required: true
  },
  platform: {
    type: String,
    enum: ['instagram', 'youtube', 'tiktok', 'twitter', 'blog'],
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  description: String
});

const campaignSchema = new mongoose.Schema({
  brandId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Brand',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['fashion', 'beauty', 'fitness', 'food', 'travel', 'tech', 'lifestyle', 'gaming', 'education', 'business']
  },
  budget: {
    min: {
      type: Number,
      required: true
    },
    max: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  deliverables: [deliverableSchema],
  requirements: {
    minFollowers: {
      type: Number,
      default: 1000
    },
    minEngagementRate: {
      type: Number,
      default: 2
    },
    targetAudience: {
      ageRange: {
        min: Number,
        max: Number
      },
      gender: {
        type: String,
        enum: ['male', 'female', 'all']
      },
      location: [String]
    },
    niches: [String]
  },
  timeline: {
    applicationDeadline: {
      type: Date,
      required: true
    },
    campaignStart: {
      type: Date,
      required: true
    },
    campaignEnd: {
      type: Date,
      required: true
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'cancelled'],
    default: 'draft'
  },
  applications: [{
    influencerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Influencer'
    },
    proposedRate: Number,
    message: String,
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    appliedAt: {
      type: Date,
      default: Date.now
    }
  }],
  selectedInfluencers: [{
    influencerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Influencer'
    },
    agreedRate: Number,
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'submitted', 'approved', 'rejected'],
      default: 'assigned'
    },
    assignedAt: Date,
    submittedAt: Date,
    approvedAt: Date,
    proofOfWork: [{
      url: String,
      platform: String,
      type: String,
      submittedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  totalBudgetAllocated: {
    type: Number,
    default: 0
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
campaignSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Calculate total budget allocated
campaignSchema.methods.calculateTotalBudget = function() {
  this.totalBudgetAllocated = this.selectedInfluencers.reduce((total, influencer) => {
    return total + (influencer.agreedRate || 0);
  }, 0);
};

module.exports = mongoose.model('Campaign', campaignSchema);