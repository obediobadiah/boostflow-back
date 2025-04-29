# BoostFlow API

Backend API for the BoostFlow application - a platform connecting businesses with social media promoters.

## Features

- **Authentication:** JWT-based authentication with user registration and login
- **User Management:** Create and manage user profiles with different roles (business, promoter)
- **Product Management:** Create, update, and manage products for promotion
- **Promotion System:** Connect promoters with products and track promotions
- **Social Media Integration:** Connect social media accounts and track promotion performance

## Technologies Used

- Node.js
- Express.js
- TypeScript
- MongoDB with Mongoose
- Passport.js for authentication
- JWT for secure tokens
- Joi for validation

## Getting Started

### Prerequisites

- Node.js (v14+ recommended)
- MongoDB (local or remote connection)

### Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```
   cd backend
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/boostflow
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   NODE_ENV=development
   ```

### Running the Server

#### Development mode
```
npm run dev
```

#### Production mode
```
npm run build
npm start
```

## API Documentation

### Authentication Endpoints

- **POST /api/auth/register** - Register a new user
- **POST /api/auth/login** - Login user
- **GET /api/auth/me** - Get current user info (requires authentication)

### User Endpoints

- **GET /api/users/:id** - Get user by ID
- **PUT /api/users/profile** - Update user profile (requires authentication)
- **PUT /api/users/change-password** - Change password (requires authentication)

### Product Endpoints

- **GET /api/products** - Get all products
- **GET /api/products/:id** - Get product by ID
- **GET /api/products/owner/:ownerId** - Get products by owner
- **GET /api/products/my/products** - Get current user's products (requires authentication)
- **POST /api/products** - Create new product (requires authentication)
- **PUT /api/products/:id** - Update product (requires authentication)
- **DELETE /api/products/:id** - Delete product (requires authentication)

### Promotion Endpoints

- **POST /api/promotions** - Create a new promotion (requires authentication)
- **GET /api/promotions/my-promotions** - Get current user's promotions (requires authentication)
- **GET /api/promotions/product/:productId** - Get promotions by product (requires authentication)
- **GET /api/promotions/track/:trackingCode** - Track click for a promotion
- **POST /api/promotions/convert/:trackingCode** - Track conversion for a promotion
- **POST /api/promotions/:promotionId/social-post** - Add social media post to promotion (requires authentication)

### Social Media Endpoints

- **GET /api/social-media/accounts** - Get connected social media accounts (requires authentication)
- **POST /api/social-media/connect/:platform** - Connect social media account (requires authentication)
- **DELETE /api/social-media/disconnect/:accountId** - Disconnect social media account (requires authentication)
- **GET /api/social-media/posts/:platform** - Get posts from a platform (requires authentication)
- **POST /api/social-media/post/:platform** - Create post on a platform (requires authentication)

## Project Structure

```
backend/
│
├── src/                    # Source code
│   ├── config/             # Configuration files
│   ├── controllers/        # Request controllers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── utils/              # Utility functions
│   ├── services/           # Business logic services
│   └── index.ts            # Entry point
│
├── dist/                   # Compiled JavaScript (generated)
├── node_modules/           # Dependencies
├── .env                    # Environment variables
├── package.json            # Project metadata and scripts
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## License

This project is licensed under the MIT License. 