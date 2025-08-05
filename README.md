# Flowtrance Finance Backend API

A high-performance Express.js backend for the Flowtrance Finance application, built with MongoDB and optimized for minimal API calls.

## 🚀 Features

- **Optimized API Design**: Single dashboard endpoint to reduce API calls
- **MongoDB Integration**: Robust data models with proper indexing

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Comprehensive request validation with Joi
- **Error Handling**: Global error handling with detailed error messages
- **Security**: Helmet.js, CORS, HPP, XSS protection, and MongoDB sanitization
- **API Documentation**: Interactive Swagger/OpenAPI documentation

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)

## 🛠️ Installation

1. **Clone the repository**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**

   ```bash
   cp env.example .env
   ```

   Edit `.env` file with your configuration:

   ```env
   PORT=5000
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/flowtrance_finance
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
       JWT_REFRESH_SECRET=your-refresh-token-secret
    JWT_REFRESH_EXPIRES_IN=30d
    CORS_ORIGIN=http://localhost:5173
   ```

4. **Start the server**

   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

5. **Update packages (if needed)**

   ```bash
   npm run update-packages
   ```

## 📊 Database Schema

### Users

- Authentication and user profile management
- Settings for currency, timezone, and theme

### Accounts

- Multiple account types (bank, cash, credit, mobile)
- Balance tracking with currency support

### Transactions

- Income and expense tracking
- Category-based organization
- Date and time tracking

### Budgets

- Monthly budget planning
- Category-based budgets
- Spending tracking against budgets

### Fixed Expenses

- Recurring expense management
- Due date tracking
- Payment status

### Possible Expenses

- Planned expense tracking
- Expected amount and notes

## 🔌 API Endpoints

### Authentication

```
POST /api/auth/register     - User registration
POST /api/auth/login        - User login
POST /api/auth/refresh      - Refresh token
POST /api/auth/forgot-password - Password reset
GET  /api/auth/profile      - Get user profile
PUT  /api/auth/profile      - Update user profile
```

### Dashboard (Optimized)

```
GET /api/dashboard          - Get all user data in one call
```

### Transactions

```
POST /api/transactions      - Create transaction
GET  /api/transactions      - Get transactions with filters
GET  /api/transactions/analytics - Get transaction analytics
PUT  /api/transactions/:id  - Update transaction
DELETE /api/transactions/:id - Delete transaction
```

### Accounts

```
POST /api/accounts          - Create account
GET  /api/accounts          - Get user accounts
PUT  /api/accounts/:id      - Update account
DELETE /api/accounts/:id    - Delete account
POST /api/accounts/transfer - Transfer funds between accounts
```

### Budgets

```
POST /api/budgets           - Create budget
GET  /api/budgets           - Get user budgets
PUT  /api/budgets/:id       - Update budget
DELETE /api/budgets/:id     - Delete budget
GET  /api/budgets/analytics - Get budget analytics
```

### Fixed Expenses

```
POST /api/fixed-expenses    - Create fixed expense
GET  /api/fixed-expenses    - Get fixed expenses
PUT  /api/fixed-expenses/:id - Update fixed expense
DELETE /api/fixed-expenses/:id - Delete fixed expense
PATCH /api/fixed-expenses/:id/mark-paid - Mark as paid
GET  /api/fixed-expenses/upcoming - Get upcoming expenses
```

### Possible Expenses

```
POST /api/possible-expenses - Create possible expense
GET  /api/possible-expenses - Get possible expenses
PUT  /api/possible-expenses/:id - Update possible expense
DELETE /api/possible-expenses/:id - Delete possible expense
GET  /api/possible-expenses/category/:category - Get by category
POST /api/possible-expenses/:id/convert - Convert to transaction
```

## 📚 API Documentation

Interactive API documentation is available at:

```
http://localhost:5000/api-docs
```

The documentation includes:

- Complete endpoint descriptions
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Interactive testing interface

All endpoints are documented with Swagger/OpenAPI 3.0 specification.

## 🎯 Performance Optimizations

### 1. Single Dashboard Endpoint

Instead of multiple API calls, the dashboard endpoint returns all necessary data:

- User profile
- Accounts and balances
- Recent transactions
- Fixed expenses
- Possible expenses
- Budgets with spending data
- Analytics and insights

### 2. Database Indexes

- Compound indexes for efficient queries
- User-specific data indexing
- Date-based indexing for transactions

### 3. Aggregation Pipelines

- MongoDB aggregation for complex analytics
- Optimized queries for reporting

## 🔒 Security Features

- **JWT Authentication**: Secure token-based auth with refresh tokens
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: Protection against brute force and DDoS attacks
- **Input Validation**: Comprehensive request validation with Joi schemas
- **CORS Configuration**: Secure cross-origin requests
- **Helmet.js**: Security headers for protection against common vulnerabilities
- **HPP Protection**: HTTP Parameter Pollution attack prevention
- **XSS Protection**: Cross-Site Scripting attack prevention
- **MongoDB Sanitization**: NoSQL injection attack prevention

## 📈 Monitoring

### Health Check

```
GET /health
```

Returns server status and environment information.

### Logging

- Development: Morgan dev format
- Production: Combined format
- Error logging with stack traces

## 🧪 Testing

```bash
# Run all tests
npm test

# Test API endpoints
npm run test-api

# Test Swagger documentation
npm run test-swagger

# Test server functionality
npm run test-server


```

## 🚀 Deployment

### Environment Variables

Make sure to set all required environment variables in production:

```env
NODE_ENV=production
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret

```

### PM2 (Recommended)

```bash
npm install -g pm2
pm2 start server.js --name "flowtrance-backend"
pm2 save
pm2 startup
```

## 📝 API Response Format

All API responses follow a consistent format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

## 🔧 Development

### Project Structure

```
backend/
├── config/          # Database and Redis configuration
├── controllers/     # Route handlers
├── middleware/      # Auth, validation, caching
├── models/          # MongoDB schemas
├── routes/          # API routes
├── server.js        # Main application file
└── package.json
```

### Adding New Features

1. **Create Model**: Add schema in `models/`
2. **Create Controller**: Add business logic in `controllers/`
3. **Create Routes**: Add endpoints in `routes/`
4. **Add Validation**: Update validation schemas
5. **Update Dashboard**: Include new data in dashboard endpoint

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
