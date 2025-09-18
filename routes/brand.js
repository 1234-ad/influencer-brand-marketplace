const express = require('express');
const { body, validationResult } = require('express-validator');
const Brand = require('../models/Brand');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// @desc    Onboard brand
// @route   POST /api/brand/onboard
// @access  Private (Brand only)
router.post('/onboard',
  protect,
  authorize('brand'),
  upload.single('logo'),
  handleMulterError,
  [
    body('companyName').notEmpty().trim(),
    body('website').isURL(),
    body('industry').notEmpty(),
    body('contactPerson.firstName').notEmpty().trim(),
    body('contactPerson.lastName').notEmpty().trim()
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

      // Check if brand profile already exists
      const existingBrand = await Brand.findOne({ userId: req.user.id });
      if (existingBrand) {
        return res.status(400).json({ message: 'Brand profile already exists' });
      }

      const {
        companyName,
        website,
        industry,
        description,
        contactPerson,
        location,
        socialMedia
      } = req.body;

      // Process uploaded logo
      let logo = null;
      if (req.file) {
        logo = req.file.path;
      }

      // Parse nested objects if they're strings
      let parsedContactPerson = contactPerson;
      if (typeof contactPerson === 'string') {
        parsedContactPerson = JSON.parse(contactPerson);
      }

      let parsedLocation = location;
      if (typeof location === 'string') {
        parsedLocation = JSON.parse(location);
      }

      let parsedSocialMedia = socialMedia;
      if (typeof socialMedia === 'string') {
        parsedSocialMedia = JSON.parse(socialMedia);
      }

      // Create brand profile
      const brand = await Brand.create({
        userId: req.user.id,
        companyName,
        website,
        industry,
        description,
        logo,
        contactPerson: parsedContactPerson,
        location: parsedLocation,
        socialMedia: parsedSocialMedia,
        subscription: {
          plan: 'basic',
          status: 'pending',
          paymentStatus: 'pending'
        }
      });

      res.status(201).json({
        success: true,
        message: 'Brand profile created successfully',
        data: brand
      });
    } catch (error) {
      console.error('Brand onboard error:', error);
      res.status(500).json({ message: 'Server error during onboarding' });
    }
  }
);

// @desc    Get brand profile
// @route   GET /api/brand/profile/:id
// @access  Public
router.get('/profile/:id', async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id)
      .populate('userId', 'email createdAt')
      .select('-subscription.paymentStatus'); // Don't expose payment details publicly

    if (!brand) {
      return res.status(404).json({ message: 'Brand not found' });
    }

    res.json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error('Get brand profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update brand profile
// @route   PUT /api/brand/update
// @access  Private (Brand only)
router.put('/update',
  protect,
  authorize('brand'),
  upload.single('logo'),
  handleMulterError,
  async (req, res) => {
    try {
      const brand = await Brand.findOne({ userId: req.user.id });
      if (!brand) {
        return res.status(404).json({ message: 'Brand profile not found' });
      }

      // Update fields
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined && key !== 'subscription') {
          if (key === 'contactPerson' && typeof req.body[key] === 'string') {
            brand[key] = JSON.parse(req.body[key]);
          } else if (key === 'location' && typeof req.body[key] === 'string') {
            brand[key] = JSON.parse(req.body[key]);
          } else if (key === 'socialMedia' && typeof req.body[key] === 'string') {
            brand[key] = JSON.parse(req.body[key]);
          } else {
            brand[key] = req.body[key];
          }
        }
      });

      // Handle logo upload
      if (req.file) {
        brand.logo = req.file.path;
      }

      await brand.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: brand
      });
    } catch (error) {
      console.error('Update brand profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Get my brand profile
// @route   GET /api/brand/me
// @access  Private (Brand only)
router.get('/me', protect, authorize('brand'), async (req, res) => {
  try {
    const brand = await Brand.findOne({ userId: req.user.id })
      .populate('userId', 'email createdAt');

    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found' });
    }

    res.json({
      success: true,
      data: brand
    });
  } catch (error) {
    console.error('Get my brand profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update subscription (dummy for Phase 1)
// @route   PUT /api/brand/subscription
// @access  Private (Brand only)
router.put('/subscription',
  protect,
  authorize('brand'),
  [
    body('plan').isIn(['basic', 'premium', 'enterprise'])
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

      const { plan } = req.body;

      const brand = await Brand.findOne({ userId: req.user.id });
      if (!brand) {
        return res.status(404).json({ message: 'Brand profile not found' });
      }

      // Update subscription (dummy implementation for Phase 1)
      brand.subscription.plan = plan;
      brand.subscription.status = 'active'; // Auto-activate for Phase 1
      brand.subscription.paymentStatus = 'paid'; // Auto-mark as paid for Phase 1
      brand.subscription.startDate = new Date();
      brand.subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      await brand.save();

      res.json({
        success: true,
        message: 'Subscription updated successfully',
        data: {
          subscription: brand.subscription
        }
      });
    } catch (error) {
      console.error('Update subscription error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Get subscription status
// @route   GET /api/brand/subscription
// @access  Private (Brand only)
router.get('/subscription', protect, authorize('brand'), async (req, res) => {
  try {
    const brand = await Brand.findOne({ userId: req.user.id }).select('subscription');
    
    if (!brand) {
      return res.status(404).json({ message: 'Brand profile not found' });
    }

    res.json({
      success: true,
      data: {
        subscription: brand.subscription
      }
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Search brands (for admin or public use)
// @route   GET /api/brand/search
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const {
      industry,
      location,
      verified,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    let query = {};

    if (industry) {
      query.industry = industry;
    }

    if (location) {
      query['location.country'] = new RegExp(location, 'i');
    }

    if (verified !== undefined) {
      query.verified = verified === 'true';
    }

    const brands = await Brand.find(query)
      .populate('userId', 'email')
      .select('-subscription')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Brand.countDocuments(query);

    res.json({
      success: true,
      data: brands,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Search brands error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;