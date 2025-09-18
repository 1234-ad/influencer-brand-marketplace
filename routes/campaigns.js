const express = require('express');
const { body, validationResult } = require('express-validator');
const Campaign = require('../models/Campaign');
const Brand = require('../models/Brand');
const Influencer = require('../models/Influencer');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// @desc    Create campaign
// @route   POST /api/campaigns/create
// @access  Private (Brand only)
router.post('/create',
  protect,
  authorize('brand'),
  [
    body('title').notEmpty().trim(),
    body('description').notEmpty().trim(),
    body('category').notEmpty(),
    body('budget.min').isNumeric(),
    body('budget.max').isNumeric(),
    body('deliverables').isArray({ min: 1 }),
    body('timeline.applicationDeadline').isISO8601(),
    body('timeline.campaignStart').isISO8601(),
    body('timeline.campaignEnd').isISO8601()
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

      // Get brand profile
      const brand = await Brand.findOne({ userId: req.user.id });
      if (!brand) {
        return res.status(404).json({ message: 'Brand profile not found' });
      }

      // Check if brand has active subscription
      if (brand.subscription.status !== 'active') {
        return res.status(403).json({ message: 'Active subscription required to create campaigns' });
      }

      const {
        title,
        description,
        category,
        budget,
        deliverables,
        requirements,
        timeline
      } = req.body;

      // Validate timeline
      const now = new Date();
      const applicationDeadline = new Date(timeline.applicationDeadline);
      const campaignStart = new Date(timeline.campaignStart);
      const campaignEnd = new Date(timeline.campaignEnd);

      if (applicationDeadline <= now) {
        return res.status(400).json({ message: 'Application deadline must be in the future' });
      }

      if (campaignStart <= applicationDeadline) {
        return res.status(400).json({ message: 'Campaign start must be after application deadline' });
      }

      if (campaignEnd <= campaignStart) {
        return res.status(400).json({ message: 'Campaign end must be after campaign start' });
      }

      // Create campaign
      const campaign = await Campaign.create({
        brandId: brand._id,
        title,
        description,
        category,
        budget,
        deliverables,
        requirements: requirements || {},
        timeline,
        status: 'active'
      });

      // Update brand's campaign count
      brand.campaignsCreated += 1;
      await brand.save();

      res.status(201).json({
        success: true,
        message: 'Campaign created successfully',
        data: campaign
      });
    } catch (error) {
      console.error('Create campaign error:', error);
      res.status(500).json({ message: 'Server error during campaign creation' });
    }
  }
);

// @desc    Get campaign details
// @route   GET /api/campaigns/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('brandId', 'companyName logo industry')
      .populate('applications.influencerId', 'firstName lastName profilePicture totalFollowers averageEngagement')
      .populate('selectedInfluencers.influencerId', 'firstName lastName profilePicture totalFollowers averageEngagement');

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update campaign status
// @route   PUT /api/campaigns/:id/status
// @access  Private (Brand only)
router.put('/:id/status',
  protect,
  authorize('brand'),
  [
    body('status').isIn(['draft', 'active', 'paused', 'completed', 'cancelled'])
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

      const { status } = req.body;

      // Get brand profile
      const brand = await Brand.findOne({ userId: req.user.id });
      if (!brand) {
        return res.status(404).json({ message: 'Brand profile not found' });
      }

      const campaign = await Campaign.findOne({ 
        _id: req.params.id, 
        brandId: brand._id 
      });

      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found or not authorized' });
      }

      campaign.status = status;
      await campaign.save();

      res.json({
        success: true,
        message: 'Campaign status updated successfully',
        data: campaign
      });
    } catch (error) {
      console.error('Update campaign status error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Submit proof of work
// @route   POST /api/campaigns/:id/proof
// @access  Private (Influencer only)
router.post('/:id/proof',
  protect,
  authorize('influencer'),
  upload.array('proofFiles', 5),
  handleMulterError,
  [
    body('proofData').notEmpty()
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

      // Get influencer profile
      const influencer = await Influencer.findOne({ userId: req.user.id });
      if (!influencer) {
        return res.status(404).json({ message: 'Influencer profile not found' });
      }

      const campaign = await Campaign.findById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Check if influencer is selected for this campaign
      const selectedInfluencer = campaign.selectedInfluencers.find(
        si => si.influencerId.toString() === influencer._id.toString()
      );

      if (!selectedInfluencer) {
        return res.status(403).json({ message: 'Not authorized for this campaign' });
      }

      if (selectedInfluencer.status !== 'in_progress') {
        return res.status(400).json({ message: 'Campaign is not in progress' });
      }

      // Parse proof data
      let proofData;
      try {
        proofData = JSON.parse(req.body.proofData);
      } catch (error) {
        return res.status(400).json({ message: 'Invalid proof data format' });
      }

      // Process uploaded files
      const proofOfWork = [];
      if (req.files && req.files.length > 0) {
        req.files.forEach(file => {
          proofOfWork.push({
            url: file.path,
            platform: proofData.platform || 'unknown',
            type: proofData.type || 'file'
          });
        });
      }

      // Add URL-based proof if provided
      if (proofData.urls && Array.isArray(proofData.urls)) {
        proofData.urls.forEach(urlData => {
          proofOfWork.push({
            url: urlData.url,
            platform: urlData.platform,
            type: urlData.type || 'link'
          });
        });
      }

      // Update selected influencer with proof
      selectedInfluencer.proofOfWork.push(...proofOfWork);
      selectedInfluencer.status = 'submitted';
      selectedInfluencer.submittedAt = new Date();

      await campaign.save();

      res.json({
        success: true,
        message: 'Proof of work submitted successfully',
        data: {
          campaignId: campaign._id,
          proofOfWork: selectedInfluencer.proofOfWork
        }
      });
    } catch (error) {
      console.error('Submit proof error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Apply to campaign
// @route   POST /api/campaigns/:id/apply
// @access  Private (Influencer only)
router.post('/:id/apply',
  protect,
  authorize('influencer'),
  [
    body('proposedRate').isNumeric(),
    body('message').optional().trim()
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

      // Get influencer profile
      const influencer = await Influencer.findOne({ userId: req.user.id });
      if (!influencer) {
        return res.status(404).json({ message: 'Influencer profile not found' });
      }

      if (influencer.status !== 'approved') {
        return res.status(403).json({ message: 'Influencer profile must be approved to apply' });
      }

      const campaign = await Campaign.findById(req.params.id);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      if (campaign.status !== 'active') {
        return res.status(400).json({ message: 'Campaign is not active' });
      }

      // Check application deadline
      if (new Date() > new Date(campaign.timeline.applicationDeadline)) {
        return res.status(400).json({ message: 'Application deadline has passed' });
      }

      // Check if already applied
      const existingApplication = campaign.applications.find(
        app => app.influencerId.toString() === influencer._id.toString()
      );

      if (existingApplication) {
        return res.status(400).json({ message: 'Already applied to this campaign' });
      }

      const { proposedRate, message } = req.body;

      // Add application
      campaign.applications.push({
        influencerId: influencer._id,
        proposedRate,
        message,
        status: 'pending'
      });

      await campaign.save();

      res.json({
        success: true,
        message: 'Application submitted successfully',
        data: {
          campaignId: campaign._id,
          applicationStatus: 'pending'
        }
      });
    } catch (error) {
      console.error('Apply to campaign error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Get campaigns (with filters)
// @route   GET /api/campaigns
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      category,
      minBudget,
      maxBudget,
      status = 'active',
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    let query = { status };

    if (category) {
      query.category = category;
    }

    if (minBudget || maxBudget) {
      query['budget.min'] = {};
      if (minBudget) query['budget.min'].$gte = parseInt(minBudget);
      if (maxBudget) query['budget.max'] = { $lte: parseInt(maxBudget) };
    }

    const campaigns = await Campaign.find(query)
      .populate('brandId', 'companyName logo industry')
      .select('-applications -selectedInfluencers')
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

// @desc    Get my campaigns (brand)
// @route   GET /api/campaigns/my
// @access  Private (Brand only)
router.get('/my', protect, authorize('brand'), async (req, res) => {
  try {
    const brand = await Brand.findOne({ userId: req.user.id });
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found' });
    }

    const campaigns = await Campaign.find({ brandId: brand._id })
      .populate('applications.influencerId', 'firstName lastName profilePicture totalFollowers')
      .populate('selectedInfluencers.influencerId', 'firstName lastName profilePicture totalFollowers')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: campaigns
    });
  } catch (error) {
    console.error('Get my campaigns error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;