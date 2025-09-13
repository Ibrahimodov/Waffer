# Waffer - Local Offers Platform

A comprehensive local marketplace platform connecting customers with local shops and productive families in Saudi Arabia. The platform enables businesses to showcase their products and services while providing customers with easy access to local offerings.

## 🌟 Features

### For Customers
- **User Registration & Authentication** - Secure account creation with OTP verification
- **Browse Local Offers** - Discover products and services from nearby businesses
- **Location-based Search** - Find offerings based on your location
- **Multi-language Support** - Arabic and English interface
- **Nafath Integration** - Saudi digital identity authentication

### For Shop Owners
- **Business Registration** - Register your commercial establishment
- **Product Management** - Add, edit, and manage your product catalog
- **Commercial Registration Validation** - Verify business legitimacy
- **Order Management** - Handle customer orders efficiently
- **Analytics Dashboard** - Track business performance

### For Productive Families
- **Family Business Registration** - Register home-based businesses
- **Specialty Categories** - Food, handicrafts, textiles, beauty, education
- **Product Showcase** - Display homemade products and services
- **Family Size Management** - Track family business capacity

## 🏗️ Architecture

### Frontend (React Native - Expo)
- **Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation 6
- **State Management**: Context API with custom hooks
- **UI Components**: Custom component library with consistent design
- **Internationalization**: i18next for Arabic/English support
- **Authentication**: JWT-based with secure storage

### Backend (Node.js)
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Express-validator middleware
- **Error Handling**: Centralized error handling system
- **API Documentation**: RESTful API design

## 📱 Mobile App Features

### Authentication System
- Email/password registration and login
- OTP verification for phone numbers
- Nafath (Saudi digital identity) integration
- Secure password reset functionality
- Auto-submit OTP when 6 digits are entered

### User Interface
- Modern, responsive design
- Arabic RTL support
- Dark/light theme compatibility
- Intuitive navigation
- Form validation with real-time feedback

### Registration Flows
- **Customer Registration**: Basic profile setup
- **Shop Registration**: Business details, commercial registration
- **Family Registration**: Family business information, specialties

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or cloud)
- Expo CLI
- Android Studio / Xcode (for device testing)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ibrahimodov/Waffer.git
   cd Waffer/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with your configuration:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/waffer
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd ../frontend/LocalOffersApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the Expo development server**
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**
   - Scan QR code with Expo Go app (Android/iOS)
   - Press 'a' for Android emulator
   - Press 'i' for iOS simulator
   - Press 'w' for web browser

## 📂 Project Structure

```
Waffer/
├── backend/                 # Node.js Express API
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── utils/             # Utility functions
│   └── server.js          # Entry point
├── frontend/
│   └── LocalOffersApp/    # React Native Expo app
│       ├── components/    # Reusable UI components
│       ├── screens/       # App screens
│       ├── navigation/    # Navigation configuration
│       ├── contexts/      # React contexts
│       ├── utils/         # Utility functions
│       ├── constants/     # App constants
│       └── App.js         # App entry point
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-otp` - OTP verification
- `POST /api/auth/forgot-password` - Password reset

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/account` - Delete user account

### Shops
- `GET /api/shops` - Get all shops
- `POST /api/shops` - Create shop
- `GET /api/shops/:id` - Get shop by ID
- `PUT /api/shops/:id` - Update shop
- `DELETE /api/shops/:id` - Delete shop

### Families
- `GET /api/families` - Get all productive families
- `POST /api/families` - Create family business
- `GET /api/families/:id` - Get family by ID
- `PUT /api/families/:id` - Update family business
- `DELETE /api/families/:id` - Delete family business

## 🛠️ Technologies Used

### Frontend
- React Native
- Expo SDK 54
- React Navigation 6
- React Context API
- i18next (Internationalization)
- Expo Vector Icons
- React Native Safe Area Context

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT (JSON Web Tokens)
- bcryptjs
- express-validator
- cors
- helmet

### Development Tools
- ESLint
- Prettier
- Nodemon
- Git

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Input validation and sanitization
- CORS protection
- Helmet.js security headers
- Rate limiting
- SQL injection prevention
- XSS protection

## 🌍 Localization

- **Arabic (العربية)**: Primary language with RTL support
- **English**: Secondary language
- Dynamic language switching
- Localized date and number formats
- Cultural adaptations for Saudi market

## 📱 Supported Platforms

- **iOS**: iPhone and iPad
- **Android**: Android 5.0+ devices
- **Web**: Modern browsers (development/testing)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Ibrahim** - Full Stack Developer
- Project developed for the Saudi local marketplace ecosystem

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team

## 🚀 Deployment

### Backend Deployment
- Deploy to Heroku, AWS, or DigitalOcean
- Configure environment variables
- Set up MongoDB Atlas for production database

### Frontend Deployment
- Build with `expo build`
- Deploy to App Store and Google Play Store
- Configure app signing and certificates

---

**Made with ❤️ for the Saudi local business community**