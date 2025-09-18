const express = require('express');
const { body, validationResult } = require('express-validator');
const Influencer = require('../models/Influencer');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// @desc    Onboard influencer
// @route   POST /api/influencer/onboard
// @access  Private (Influencer only)
router.post('/onboard', 
  protect, 
  authorize('influencer'),
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'kycDocument', maxCount: 3 }
  ]),
  handleMulterError,
  [
    body('firstName').notEmpty().trim(),
    body('lastName').notEmpty().trim(),
    body('niche').isArray({ min: 1 }),
    body('socialAccounts').isArray({ min: 1 })
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

      // Check if influencer profile already exists
      const existingInfluencer = await Influencer.findOne({ userId: req.user.id });
      if (existingInfluencer) {
        return res.status(400).json({ message: 'Influencer profile already exists' });
      }

      const {
        firstName,
        lastName,
        bio,
        niche,
        location,
        socialAccounts
      } = req.body;

      // Process uploaded files
      let profilePicture = null;
      let kycDocuments = [];

      if (req.files) {
        if (req.files.profilePicture) {
          profilePicture = req.files.profilePicture[0].path;
        }

        if (req.files.kycDocument) {
          kycDocuments = req.files.kycDocument.map(file => ({
            type: 'national_id', // Default type, should be specified in request
            documentUrl: file.path,
            verified: false
          }));
        }
      }

      // Parse social accounts if it's a string
      let parsedSocialAccounts = socialAccounts;
      if (typeof socialAccounts === 'string') {
        parsedSocialAccounts = JSON.parse(socialAccounts);
      }

      // Parse location if it's a string
      let parsedLocation = location;
      if (typeof location === 'string') {
        parsedLocation = JSON.parse(location);
      }

      // Create influencer profile
      const influencer = await Influencer.create({
        userId: req.user.id,
        firstName,
        lastName,
        bio,
        profilePicture,
        niche: Array.isArray(niche) ? niche : JSON.parse(niche),
        location: parsedLocation,
        socialAccounts: parsedSocialAccounts,
        kycDocuments,
        status: 'pending_verification'
      });

      res.status(201).json({
        success: true,
        message: 'Influencer profile created successfully',
        data: influencer
      });
    } catch (error) {
      console.error('Influencer onboard error:', error);
      res.status(500).json({ message: 'Server error during onboarding' });
    }
  }
);

// @desc    Get influencer profile
// @route   GET /api/influencer/profile/:id
// @access  Public
router.get('/profile/:id', async (req, res) => {
  try {
    const influencer = await Influencer.findById(req.params.id)
      .populate('userId', 'email createdAt')
      .select('-kycDocuments'); // Don't expose KYC documents publicly

    if (!influencer) {
      return res.status(404).json({ message: 'Influencer not found' });
    }

    res.json({
      success: true,
      data: influencer
    });
  } catch (error) {
    console.error('Get influencer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Update influencer profile
// @route   PUT /api/influencer/update
// @access  Private (Influencer only)
router.put('/update',
  protect,
  authorize('influencer'),
  upload.fields([
    { name: 'profilePicture', maxCount: 1 },
    { name: 'kycDocument', maxCount: 3 }
  ]),
  handleMulterError,
  async (req, res) => {
    try {
      const influencer = await Influencer.findOne({ userId: req.user.id });
      if (!influencer) {
        return res.status(404).json({ message: 'Influencer profile not found' });
      }

      // Only allow updates if not approved or if updating allowed fields
      if (influencer.status === 'approved') {
        // Limit what can be updated for approved influencers
        const allowedUpdates = ['bio', 'socialAccounts'];
        const updates = Object.keys(req.body);
        const isValidUpdate = updates.every(update => allowedUpdates.includes(update));
        
        if (!isValidUpdate) {
          return res.status(400).json({ 
            message: 'Cannot update these fields for approved influencers' 
          });
        }
      }

      // Update fields
      Object.keys(req.body).forEach(key => {
        if (req.body[key] !== undefined) {
          if (key === 'socialAccounts' && typeof req.body[key] === 'string') {
            influencer[key] = JSON.parse(req.body[key]);
          } else if (key === 'location' && typeof req.body[key] === 'string') {
            influencer[key] = JSON.parse(req.body[key]);
          } else if (key === 'niche' && typeof req.body[key] === 'string') {
            influencer[key] = JSON.parse(req.body[key]);
          } else {
            influencer[key] = req.body[key];
          }
        }
      });

      // Handle file uploads
      if (req.files) {
        if (req.files.profilePicture) {
          influencer.profilePicture = req.files.profilePicture[0].path;
        }

        if (req.files.kycDocument) {
          const newKycDocs = req.files.kycDocument.map(file => ({
            type: 'national_id',
            documentUrl: file.path,
            verified: false
          }));
          influencer.kycDocuments.push(...newKycDocs);
        }
      }

      await influencer.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: influencer
      });
    } catch (error) {
      console.error('Update influencer profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Get my influencer profile
// @route   GET /api/influencer/me
// @access  Private (Influencer only)
router.get('/me', protect, authorize('influencer'), async (req, res) => {
  try {
    const influencer = await Influencer.findOne({ userId: req.user.id })
      .populate('userId', 'email createdAt');

    if (!influencer) {
      return res.status(404).json({ message: 'Influencer profile not found' });
    }

    res.json({
      success: true,
      data: influencer
    });
  } catch (error) {
    console.error('Get my influencer profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Search influencers
// @route   GET /api/influencer/search
// @access  Private (Brand only)
router.get('/search', protect, authorize('brand'), async (req, res) => {
  try {
    const {
      niche,
      minFollowers,
      maxFollowers,
      minEngagement,
      location,
      page = 1,
      limit = 10
    } = req.query;

    // Build query
    let query = { status: 'approved' };

    if (niche) {
      query.niche = { $in: niche.split(',') };
    }

    if (minFollowers || maxFollowers) {
      query.totalFollowers = {};
      if (minFollowers) query.totalFollowers.$gte = parseInt(minFollowers);
      if (maxFollowers) query.totalFollowers.$lte = parseInt(maxFollowers);
    }

    if (minEngagement) {
      query.averageEngagement = { $gte: parseFloat(minEngagement) };
    }

    if (location) {
      query['location.country'] = new RegExp(location, 'i');
    }

    const influencers = await Influencer.find(query)
      .populate('userId', 'email')
      .select('-kycDocuments')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ totalFollowers: -1 });

    const total = await Influencer.countDocuments(query);

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
    console.error('Search influencers error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;