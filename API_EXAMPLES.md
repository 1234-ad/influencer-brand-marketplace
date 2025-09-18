# API Usage Examples

This document provides practical examples of how to use the Influencer-Brand Marketplace API.

## Authentication

### 1. Register a New User

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "influencer@example.com",
    "password": "password123",
    "role": "influencer"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64a1b2c3d4e5f6789012345",
    "email": "influencer@example.com",
    "role": "influencer",
    "emailVerified": false
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "influencer@example.com",
    "password": "password123"
  }'
```

## Influencer Onboarding

### 3. Create Influencer Profile

```bash
curl -X POST http://localhost:5000/api/influencer/onboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "firstName=John" \
  -F "lastName=Doe" \
  -F "bio=Fashion and lifestyle influencer" \
  -F "niche=[\"fashion\", \"lifestyle\"]" \
  -F "location={\"country\": \"USA\", \"city\": \"New York\"}" \
  -F "socialAccounts=[{\"platform\": \"instagram\", \"username\": \"johndoe\", \"url\": \"https://instagram.com/johndoe\", \"followerCount\": 50000, \"engagementRate\": 3.5}]" \
  -F "profilePicture=@profile.jpg" \
  -F "kycDocument=@id_document.pdf"
```

### 4. Get Influencer Profile

```bash
curl -X GET http://localhost:5000/api/influencer/profile/64a1b2c3d4e5f6789012345 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Brand Operations

### 5. Create Brand Profile

```bash
curl -X POST http://localhost:5000/api/brand/onboard \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "companyName=Fashion Brand Co" \
  -F "website=https://fashionbrand.com" \
  -F "industry=fashion" \
  -F "description=Premium fashion brand" \
  -F "contactPerson={\"firstName\": \"Jane\", \"lastName\": \"Smith\", \"position\": \"Marketing Manager\"}" \
  -F "location={\"country\": \"USA\", \"city\": \"Los Angeles\"}" \
  -F "logo=@brand_logo.png"
```

### 6. Update Subscription

```bash
curl -X PUT http://localhost:5000/api/brand/subscription \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "premium"
  }'
```

## Campaign Management

### 7. Create Campaign

```bash
curl -X POST http://localhost:5000/api/campaigns/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer Fashion Collection",
    "description": "Promote our new summer collection",
    "category": "fashion",
    "budget": {
      "min": 500,
      "max": 2000,
      "currency": "USD"
    },
    "deliverables": [
      {
        "type": "post",
        "platform": "instagram",
        "quantity": 3,
        "description": "3 Instagram posts featuring our products"
      }
    ],
    "requirements": {
      "minFollowers": 10000,
      "minEngagementRate": 2.5,
      "targetAudience": {
        "ageRange": {"min": 18, "max": 35},
        "gender": "all",
        "location": ["USA", "Canada"]
      },
      "niches": ["fashion", "lifestyle"]
    },
    "timeline": {
      "applicationDeadline": "2024-01-15T23:59:59.000Z",
      "campaignStart": "2024-01-20T00:00:00.000Z",
      "campaignEnd": "2024-02-20T23:59:59.000Z"
    }
  }'
```

### 8. Apply to Campaign

```bash
curl -X POST http://localhost:5000/api/campaigns/64a1b2c3d4e5f6789012345/apply \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "proposedRate": 1200,
    "message": "I would love to work with your brand. My audience aligns perfectly with your target demographic."
  }'
```

### 9. Submit Proof of Work

```bash
curl -X POST http://localhost:5000/api/campaigns/64a1b2c3d4e5f6789012345/proof \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "proofData={\"platform\": \"instagram\", \"type\": \"post\", \"urls\": [{\"url\": \"https://instagram.com/p/ABC123\", \"platform\": \"instagram\", \"type\": \"post\"}]}" \
  -F "proofFiles=@screenshot1.jpg" \
  -F "proofFiles=@screenshot2.jpg"
```

### 10. Get Campaigns with Filters

```bash
curl -X GET "http://localhost:5000/api/campaigns?category=fashion&minBudget=500&maxBudget=2000&status=active&page=1&limit=10"
```

## Chat System

### 11. Create Direct Chat

```bash
curl -X POST http://localhost:5000/api/chat/direct \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "64a1b2c3d4e5f6789012346"
  }'
```

### 12. Send Message

```bash
curl -X POST http://localhost:5000/api/chat/64a1b2c3d4e5f6789012347/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello! I am interested in your campaign.",
    "messageType": "text"
  }'
```

### 13. Send Message with File

```bash
curl -X POST http://localhost:5000/api/chat/64a1b2c3d4e5f6789012347/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "content=Here is my portfolio" \
  -F "file=@portfolio.pdf"
```

### 14. Get Chat Messages

```bash
curl -X GET "http://localhost:5000/api/chat/64a1b2c3d4e5f6789012347?page=1&limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Admin Operations

### 15. Get Dashboard Stats

```bash
curl -X GET http://localhost:5000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 16. Get Pending Influencers

```bash
curl -X GET "http://localhost:5000/api/admin/influencers/pending?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

### 17. Approve Influencer

```bash
curl -X PUT http://localhost:5000/api/admin/influencers/64a1b2c3d4e5f6789012345/verify \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve"
  }'
```

### 18. Reject Influencer

```bash
curl -X PUT http://localhost:5000/api/admin/influencers/64a1b2c3d4e5f6789012345/verify \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reject",
    "rejectionReason": "Insufficient follower count or engagement rate"
  }'
```

## Search and Discovery

### 19. Search Influencers (Brand Only)

```bash
curl -X GET "http://localhost:5000/api/influencer/search?niche=fashion,lifestyle&minFollowers=10000&maxFollowers=100000&minEngagement=2.0&location=USA&page=1&limit=10" \
  -H "Authorization: Bearer YOUR_BRAND_JWT_TOKEN"
```

### 20. Search Brands

```bash
curl -X GET "http://localhost:5000/api/brand/search?industry=fashion&location=USA&verified=true&page=1&limit=10"
```

## Error Handling Examples

### 21. Invalid Token Response

```json
{
  "success": false,
  "message": "Not authorized, token failed"
}
```

### 22. Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Invalid value",
      "param": "email",
      "location": "body"
    }
  ]
}
```

### 23. Resource Not Found Response

```json
{
  "success": false,
  "message": "Campaign not found"
}
```

## File Upload Examples

### 24. Upload Profile Picture

```bash
curl -X PUT http://localhost:5000/api/influencer/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "profilePicture=@new_profile.jpg" \
  -F "bio=Updated bio text"
```

### 25. Upload Multiple KYC Documents

```bash
curl -X PUT http://localhost:5000/api/influencer/update \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "kycDocument=@passport.pdf" \
  -F "kycDocument=@utility_bill.pdf" \
  -F "kycDocument=@bank_statement.pdf"
```

## Pagination Examples

### 26. Paginated Campaign List

```bash
curl -X GET "http://localhost:5000/api/campaigns?page=2&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 5,
    "total": 25,
    "pages": 5
  }
}
```

## Health Check

### 27. Check API Health

```bash
curl -X GET http://localhost:5000/api/health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-10T10:30:00.000Z",
  "environment": "development"
}
```

## Notes

- Replace `YOUR_JWT_TOKEN` with the actual JWT token received from login
- Replace `YOUR_ADMIN_JWT_TOKEN` with an admin user's JWT token
- Replace object IDs (like `64a1b2c3d4e5f6789012345`) with actual MongoDB ObjectIds
- File uploads use `multipart/form-data` content type
- JSON requests use `application/json` content type
- All timestamps should be in ISO 8601 format
- File size limits apply (default 5MB per file)