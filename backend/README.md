# LocalOffers Backend API

A Node.js/Express REST API for the LocalOffers application supporting customers, shops, and productive families (اسر منتجة).

## Features

- **Multi-user Authentication**: Support for customers, shops, and productive families
- **Nafath Integration**: Saudi Arabia digital identity authentication
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **Error Handling**: Centralized error handling
- **Security**: Helmet, CORS, rate limiting
- **Database**: MongoDB with Mongoose ODM

## User Types

### 1. Customer (عميل)
- Basic user registration
- Browse shops and families
- View offers and products

### 2. Shop (متجر)
- Business registration with commercial registration number
- Manage shop profile and offers
- Business hours and location management

### 3. Productive Family (أسرة منتجة)
- Family business registration
- Manage products and specialties
- Certification management

## API Endpoints

### Authentication
```
POST   /api/auth/register              # Register customer
POST   /api/auth/register/shop         # Register shop
POST   /api/auth/register/family       # Register productive family
POST   /api/auth/login                 # Login
POST   /api/auth/logout                # Logout
GET    /api/auth/me                    # Get current user
POST   /api/auth/forgot-password       # Forgot password
PUT    /api/auth/reset-password/:token # Reset password
PUT    /api/auth/update-password       # Update password
GET    /api/auth/verify-email/:token   # Verify email
POST   /api/auth/resend-verification   # Resend verification
POST   /api/auth/nafath/auth           # Nafath authentication
POST   /api/auth/nafath/callback       # Nafath callback
```

### Users
```
GET    /api/users                      # Get all users (admin)
GET    /api/users/:id                  # Get user by ID
PUT    /api/users/profile              # Update profile
PUT    /api/users/profile/avatar       # Upload avatar
PUT    /api/users/profile/location     # Update location
PUT    /api/users/profile/business     # Update business info
PUT    /api/users/profile/family       # Update family info
PUT    /api/users/profile/notifications # Update notification settings
DELETE /api/users/:id                  # Delete user
```

### Shops
```
GET    /api/shops                      # Get all shops
GET    /api/shops/nearby               # Get nearby shops
GET    /api/shops/category/:category   # Get shops by category
GET    /api/shops/:id                  # Get shop by ID
GET    /api/shops/:id/offers           # Get shop offers
PUT    /api/shops/profile              # Update shop profile
PUT    /api/shops/profile/images       # Upload shop images
POST   /api/shops/offers               # Add offer
PUT    /api/shops/offers/:offerId      # Update offer
DELETE /api/shops/offers/:offerId      # Delete offer
```

### Productive Families
```
GET    /api/families                   # Get all families
GET    /api/families/nearby            # Get nearby families
GET    /api/families/specialty/:spec   # Get families by specialty
GET    /api/families/:id               # Get family by ID
GET    /api/families/:id/products      # Get family products
PUT    /api/families/profile           # Update family profile
PUT    /api/families/profile/images    # Upload family images
POST   /api/families/products          # Add product
PUT    /api/families/products/:id      # Update product
DELETE /api/families/products/:id      # Delete product
POST   /api/families/certifications    # Add certification
DELETE /api/families/certifications/:id # Remove certification
```

## Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Update environment variables in `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/localoffers
JWT_SECRET=your_super_secret_jwt_key_here
FRONTEND_URL=http://localhost:19006
```

4. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/localoffers |
| JWT_SECRET | JWT secret key | - |
| JWT_EXPIRE | JWT expiration | 7d |
| FRONTEND_URL | Frontend URL for CORS | http://localhost:19006 |
| NAFATH_API_URL | Nafath API URL | - |
| NAFATH_CLIENT_ID | Nafath client ID | - |
| NAFATH_CLIENT_SECRET | Nafath client secret | - |

## Database Schema

### User Model
- Basic information (name, email, phone, password)
- User type (customer, shop, productive_family)
- Nafath authentication data
- Location information
- Business information (for shops and families)
- Family-specific information
- Account status and preferences

## Security Features

- **Password Hashing**: bcryptjs with salt rounds
- **JWT Authentication**: Secure token-based auth
- **Input Validation**: express-validator
- **Rate Limiting**: Prevent abuse
- **CORS**: Cross-origin resource sharing
- **Helmet**: Security headers
- **Data Sanitization**: Prevent injection attacks

## Error Handling

- Centralized error handling middleware
- Custom error responses
- Validation error formatting
- Development vs production error details

## Testing

```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License