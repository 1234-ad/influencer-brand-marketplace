const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Influencer = require('../models/Influencer');
const Brand = require('../models/Brand');
const Campaign = require('../models/Campaign');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
router.get('/dashboard', protect, authorize('admin'), async (req, res) => {
  try {
    const [
      totalUsers,
      totalInfluencers,
      totalBrands,
      totalCampaigns,
      pendingInfluencers,
      activeCampaigns,
      completedCampaigns
    ] = await Promise.all([
      User.countDocuments(),
      Influencer.countDocuments(),
      Brand.countDocuments(),
      Campaign.countDocuments(),
      Influencer.countDocuments({ status: 'pending_verification' }),
      Campaign.countDocuments({ status: 'active' }),
      Campaign.countDocuments({ status: 'completed' })
    ]);

    const stats = {
      users: {
        total: totalUsers,
        influencers: totalInfluencers,
        brands: totalBrands
      },
      campaigns: {
        total: totalCampaigns,
        active: activeCampaigns,
        completed: completedCampaigns
      },
      pending: {
        influencerVerifications: pendingInfluencers
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get pending influencers for verification
// @route   GET /api/admin/influencers/pending
// @access  Private (Admin only)
router.get('/influencers/pending', protect, authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const influencers = await Influencer.find({ status: 'pending_verification' })
      .populate('userId', 'email createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Influencer.countDocuments({ status: 'pending_verification' });

    res.json({
      success: true,
      data: influencers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get pending influencers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Approve/Reject influencer
// @route   PUT /api/admin/influencers/:id/verify
// @access  Private (Admin only)
router.put('/influencers/:id/verify',
  protect,
  authorize('admin'),
  [
    body('action').isIn(['approve', 'reject']),
    body('rejectionReason').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }

      const { action, rejectionReason } = req.body;
      const influencerId = req.params.id;

      const influencer = await Influencer.findById(influencerId);
      if (!influencer) {
        return res.status(404).json({ message: 'Influencer not found' });
      }

      if (influencer.status !== 'pending_verification') {
        return res.status(400).json({ message: 'Influencer is not pending verification' });
      }

      if (action === 'approve') {
        influencer.status = 'approved';
        influencer.approvedAt = new Date();
        influencer.rejectionReason = undefined;
      } else {
        influencer.status = 'rejected';
        influencer.rejectionReason = rejectionReason || 'No reason provided';
        influencer.approvedAt = undefined;
      }

      await influencer.save();

      res.json({
        success: true,
        message: `Influencer ${action}d successfully`,
        data: influencer
      });
    } catch (error) {
      console.error('Verify influencer error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const { 
      role, 
      isActive, 
      page = 1, 
      limit = 20,
      search 
    } = req.query;

    // Build query
    let query = {};
    
    if (role) {
      query.role = role;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (search) {
      query.email = { $regex: search, $options: 'i' };
    }

    const users = await User.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Private (Admin only)
router.put('/users/:id/toggle-status', protect, authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow deactivating admin users
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Cannot deactivate admin users' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        userId: user._id,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get all campaigns
// @route   GET /api/admin/campaigns
// @access  Private (Admin only)
router.get('/campaigns', protect, authorize('admin'), async (req, res) => {
  try {
    const { 
      status, 
      category,
      page = 1, 
      limit = 20 
    } = req.query;

    // Build query
    let query = {};
    
    if (status) {
      query.status = status;
    }
    
    if (category) {
      query.category = category;
    }

    const campaigns = await Campaign.find(query)
      .populate('brandId', 'companyName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Campaign.countDocuments(query);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get flagged content/reports
// @route   GET /api/admin/reports
// @access  Private (Admin only)
router.get('/reports', protect, authorize('admin'), async (req, res) => {
  try {
    // This is a placeholder for future reporting system
    // In Phase 2, this would include user reports, content moderation, etc.
    
    res.json({
      success: true,
      message: 'Reports feature coming in Phase 2',
      data: []
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Get platform analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
router.get('/analytics', protect, authorize('admin'), async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    const [
      newUsers,
      newInfluencers,
      newBrands,
      newCampaigns,
      completedCampaigns
    ] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: startDate } }),
      Influencer.countDocuments({ createdAt: { $gte: startDate } }),
      Brand.countDocuments({ createdAt: { $gte: startDate } }),
      Campaign.countDocuments({ createdAt: { $gte: startDate } }),
      Campaign.countDocuments({ 
        status: 'completed',
        updatedAt: { $gte: startDate }
      })
    ]);

    // Calculate growth rates (simplified)
    const analytics = {
      period: `${daysAgo} days`,
      growth: {
        users: newUsers,
        influencers: newInfluencers,
        brands: newBrands,
        campaigns: newCampaigns,
        completedCampaigns
      },
      // Add more analytics as needed
      engagement: {
        campaignCompletionRate: newCampaigns > 0 ? (completedCampaigns / newCampaigns * 100).toFixed(2) : 0
      }
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Verify KYC document
// @route   PUT /api/admin/kyc/:influencerId/:documentId/verify
// @access  Private (Admin only)
router.put('/kyc/:influencerId/:documentId/verify',
  protect,
  authorize('admin'),
  [
    body('verified').isBoolean()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          message: 'Validation failed', 
          errors: errors.array() 
        });
      }

      const { influencerId, documentId } = req.params;
      const { verified } = req.body;

      const influencer = await Influencer.findById(influencerId);
      if (!influencer) {
        return res.status(404).json({ message: 'Influencer not found' });
      }

      const document = influencer.kycDocuments.id(documentId);
      if (!document) {
        return res.status(404).json({ message: 'KYC document not found' });
      }

      document.verified = verified;
      await influencer.save();

      res.json({
        success: true,
        message: `KYC document ${verified ? 'verified' : 'rejected'} successfully`,
        data: document
      });
    } catch (error) {
      console.error('Verify KYC error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;