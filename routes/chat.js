const express = require('express');
const { body, validationResult } = require('express-validator');
const Chat = require('../models/Chat');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const { protect } = require('../middleware/auth');
const { upload, handleMulterError } = require('../middleware/upload');

const router = express.Router();

// @desc    Send message
// @route   POST /api/chat/:id/send
// @access  Private
router.post('/:id/send',
  protect,
  upload.single('file'),
  handleMulterError,
  [
    body('content').notEmpty().trim()
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

      const { content, messageType = 'text' } = req.body;
      const chatId = req.params.id;

      // Find or create chat
      let chat = await Chat.findById(chatId);
      
      if (!chat) {
        return res.status(404).json({ message: 'Chat not found' });
      }

      // Check if user is participant
      if (!chat.participants.includes(req.user.id)) {
        return res.status(403).json({ message: 'Not authorized to send messages in this chat' });
      }

      // Handle file upload
      let fileUrl = null;
      let fileName = null;
      let actualMessageType = messageType;

      if (req.file) {
        fileUrl = req.file.path;
        fileName = req.file.originalname;
        actualMessageType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';
      }

      // Create message
      const message = {
        senderId: req.user.id,
        content,
        messageType: actualMessageType,
        fileUrl,
        fileName,
        readBy: [{
          userId: req.user.id,
          readAt: new Date()
        }]
      };

      // Add message to chat
      chat.messages.push(message);
      chat.updateLastMessage(message);
      
      await chat.save();

      // Populate sender info for response
      await chat.populate('messages.senderId', 'email role');

      const newMessage = chat.messages[chat.messages.length - 1];

      res.json({
        success: true,
        message: 'Message sent successfully',
        data: newMessage
      });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Get chat messages
// @route   GET /api/chat/:id
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const chatId = req.params.id;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(chatId)
      .populate('participants', 'email role')
      .populate('messages.senderId', 'email role')
      .populate('campaignId', 'title');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.some(p => p._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized to view this chat' });
    }

    // Paginate messages (latest first)
    const startIndex = Math.max(0, chat.messages.length - (page * limit));
    const endIndex = chat.messages.length - ((page - 1) * limit);
    
    const paginatedMessages = chat.messages.slice(startIndex, endIndex).reverse();

    // Mark messages as read
    const unreadMessages = chat.messages.filter(msg => 
      !msg.readBy.some(read => read.userId.toString() === req.user.id)
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => {
        if (!msg.readBy.some(read => read.userId.toString() === req.user.id)) {
          msg.readBy.push({
            userId: req.user.id,
            readAt: new Date()
          });
        }
      });
      await chat.save();
    }

    res.json({
      success: true,
      data: {
        chat: {
          _id: chat._id,
          participants: chat.participants,
          campaignId: chat.campaignId,
          chatType: chat.chatType,
          lastMessage: chat.lastMessage,
          createdAt: chat.createdAt,
          updatedAt: chat.updatedAt
        },
        messages: paginatedMessages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: chat.messages.length,
          hasMore: startIndex > 0
        }
      }
    });
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Create or get direct chat
// @route   POST /api/chat/direct
// @access  Private
router.post('/direct',
  protect,
  [
    body('participantId').notEmpty()
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

      const { participantId } = req.body;

      // Check if participant exists
      const participant = await User.findById(participantId);
      if (!participant) {
        return res.status(404).json({ message: 'Participant not found' });
      }

      // Check if chat already exists
      let chat = await Chat.findOne({
        chatType: 'direct',
        participants: { $all: [req.user.id, participantId] }
      }).populate('participants', 'email role');

      if (!chat) {
        // Create new chat
        chat = await Chat.create({
          participants: [req.user.id, participantId],
          chatType: 'direct'
        });

        await chat.populate('participants', 'email role');
      }

      res.json({
        success: true,
        message: chat.messages.length === 0 ? 'Chat created successfully' : 'Chat found',
        data: chat
      });
    } catch (error) {
      console.error('Create direct chat error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Create campaign chat
// @route   POST /api/chat/campaign
// @access  Private
router.post('/campaign',
  protect,
  [
    body('campaignId').notEmpty(),
    body('participantId').notEmpty()
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

      const { campaignId, participantId } = req.body;

      // Check if campaign exists
      const campaign = await Campaign.findById(campaignId);
      if (!campaign) {
        return res.status(404).json({ message: 'Campaign not found' });
      }

      // Check if participant exists
      const participant = await User.findById(participantId);
      if (!participant) {
        return res.status(404).json({ message: 'Participant not found' });
      }

      // Check if chat already exists
      let chat = await Chat.findOne({
        chatType: 'campaign',
        campaignId,
        participants: { $all: [req.user.id, participantId] }
      }).populate('participants', 'email role').populate('campaignId', 'title');

      if (!chat) {
        // Create new chat
        chat = await Chat.create({
          participants: [req.user.id, participantId],
          campaignId,
          chatType: 'campaign'
        });

        await chat.populate('participants', 'email role').populate('campaignId', 'title');
      }

      res.json({
        success: true,
        message: chat.messages.length === 0 ? 'Campaign chat created successfully' : 'Campaign chat found',
        data: chat
      });
    } catch (error) {
      console.error('Create campaign chat error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// @desc    Get user's chats
// @route   GET /api/chat/my
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const chats = await Chat.find({
      participants: req.user.id,
      isActive: true
    })
      .populate('participants', 'email role')
      .populate('campaignId', 'title')
      .populate('lastMessage.senderId', 'email role')
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Chat.countDocuments({
      participants: req.user.id,
      isActive: true
    });

    // Add unread count for each chat
    const chatsWithUnreadCount = chats.map(chat => {
      const unreadCount = chat.messages.filter(msg => 
        msg.senderId.toString() !== req.user.id &&
        !msg.readBy.some(read => read.userId.toString() === req.user.id)
      ).length;

      return {
        ...chat.toObject(),
        unreadCount
      };
    });

    res.json({
      success: true,
      data: chatsWithUnreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get my chats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @desc    Mark messages as read
// @route   PUT /api/chat/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const chatId = req.params.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is participant
    if (!chat.participants.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Mark all unread messages as read
    let updated = false;
    chat.messages.forEach(msg => {
      if (!msg.readBy.some(read => read.userId.toString() === req.user.id)) {
        msg.readBy.push({
          userId: req.user.id,
          readAt: new Date()
        });
        updated = true;
      }
    });

    if (updated) {
      await chat.save();
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;