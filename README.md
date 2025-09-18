# Influencer-Brand Marketplace Backend

A comprehensive backend API for connecting influencers with brands for marketing campaigns. Built with Node.js, Express, and MongoDB.

## 🚀 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (Influencer, Brand, Admin)
- Password reset functionality
- Email verification

### User Management
- **Influencers**: Profile creation, KYC document upload, social media linking
- **Brands**: Company profiles, subscription management
- **Admins**: User verification, platform management

### Core Functionality
- **Campaign Management**: Create, manage, and track marketing campaigns
- **Application System**: Influencers can apply to campaigns
- **Chat System**: Direct messaging between users
- **File Upload**: Profile pictures, documents, proof of work
- **Background Jobs**: Automated social media stats synchronization

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, bcrypt.js
- **File Upload**: Multer
- **Email**: Nodemailer
- **Background Jobs**: node-cron
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## ⚙️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/1234-ad/influencer-brand-marketplace.git
   cd influencer-brand-marketplace
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/influencer-marketplace
   JWT_SECRET=your-super-secret-jwt-key
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   PORT=5000
   NODE_ENV=development
   ```

4. **Create upload directories**
   ```bash
   mkdir -p uploads/images uploads/documents uploads/misc
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints
```
POST /api/auth/signup          # Register new user
POST /api/auth/login           # User login
GET  /api/auth/me              # Get current user
POST /api/auth/reset-password  # Request password reset
PUT  /api/auth/reset-password/:token # Reset password
```

### Influencer Endpoints
```
POST /api/influencer/onboard   # Create influencer profile
GET  /api/influencer/profile/:id # Get influencer profile
PUT  /api/influencer/update    # Update profile
GET  /api/influencer/me        # Get my profile
GET  /api/influencer/search    # Search influencers (Brand only)
```

### Brand Endpoints
```
POST /api/brand/onboard        # Create brand profile
GET  /api/brand/profile/:id    # Get brand profile
PUT  /api/brand/update         # Update profile
GET  /api/brand/me             # Get my profile
PUT  /api/brand/subscription   # Update subscription
GET  /api/brand/subscription   # Get subscription status
```

### Campaign Endpoints
```
POST /api/campaigns/create     # Create campaign (Brand only)
GET  /api/campaigns/:id        # Get campaign details
PUT  /api/campaigns/:id/status # Update campaign status
POST /api/campaigns/:id/proof  # Submit proof of work
POST /api/campaigns/:id/apply  # Apply to campaign
GET  /api/campaigns            # Get campaigns with filters
GET  /api/campaigns/my         # Get my campaigns (Brand only)
```

### Chat Endpoints
```
POST /api/chat/:id/send        # Send message
GET  /api/chat/:id             # Get chat messages
POST /api/chat/direct          # Create direct chat
POST /api/chat/campaign        # Create campaign chat
GET  /api/chat/my              # Get my chats
PUT  /api/chat/:id/read        # Mark messages as read
```

### Admin Endpoints
```
GET  /api/admin/dashboard      # Dashboard statistics
GET  /api/admin/influencers/pending # Pending verifications
PUT  /api/admin/influencers/:id/verify # Approve/reject influencer
GET  /api/admin/users          # Get all users
PUT  /api/admin/users/:id/toggle-status # Toggle user status
GET  /api/admin/campaigns      # Get all campaigns
GET  /api/admin/analytics      # Platform analytics
```

## 🗂️ Project Structure

```
├── models/                 # Database models
│   ├── User.js
│   ├── Influencer.js
│   ├── Brand.js
│   ├── Campaign.js
│   └── Chat.js
├── routes/                 # API routes
│   ├── auth.js
│   ├── influencer.js
│   ├── brand.js
│   ├── campaigns.js
│   ├── chat.js
│   └── admin.js
├── middleware/             # Custom middleware
│   ├── auth.js
│   ├── errorHandler.js
│   └── upload.js
├── utils/                  # Utility functions
│   └── email.js
├── jobs/                   # Background jobs
│   └── socialMediaSync.js
├── uploads/                # File uploads
├── server.js              # Main server file
└── package.json
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt.js for secure password storage
- **Rate Limiting**: Prevent API abuse
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Input Validation**: express-validator for request validation
- **File Upload Security**: File type and size restrictions

## 🔄 Background Jobs

### Social Media Sync
- **Schedule**: Daily at 2:00 AM UTC
- **Function**: Updates influencer social media statistics
- **Features**: 
  - Fetches follower counts and engagement rates
  - Calculates popularity trends
  - Updates influencer profiles automatically

## 📊 Database Schema

### User Roles
- **Influencer**: Content creators with social media presence
- **Brand**: Companies looking for marketing partnerships
- **Admin**: Platform administrators

### Key Collections
- **Users**: Authentication and basic user data
- **Influencers**: Detailed influencer profiles and KYC
- **Brands**: Company information and subscriptions
- **Campaigns**: Marketing campaign details and applications
- **Chats**: Messaging system between users

## 🚀 Deployment

### Environment Variables for Production
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/influencer-marketplace
JWT_SECRET=your-production-jwt-secret
EMAIL_HOST=your-smtp-host
EMAIL_PORT=587
EMAIL_USER=your-production-email
EMAIL_PASS=your-production-password
PORT=5000
```

### GitHub Actions CI/CD
The project includes GitHub Actions workflow for automated deployment.

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📈 Future Enhancements (Phase 2)

- **Payment Integration**: Real payment processing with Stripe/PayPal
- **Advanced Analytics**: Detailed campaign performance metrics
- **Real-time Chat**: WebSocket implementation
- **Social Media APIs**: Direct integration with Instagram/YouTube APIs
- **Advanced Search**: Elasticsearch integration
- **Mobile App**: React Native mobile application
- **SQL Migration**: PostgreSQL/MySQL database migration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@influencer-marketplace.com

## 🙏 Acknowledgments

- Express.js team for the excellent web framework
- MongoDB team for the robust database solution
- All contributors who helped build this platform

---

**Built with ❤️ for the creator economy**