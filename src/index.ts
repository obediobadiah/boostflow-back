import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import passport from 'passport';
import './config/passport';
import { errorHandler, notFound } from './middleware/error.middleware';
import { initDatabase, sequelize } from './models';

// Load environment variables
dotenv.config();

// Debug the sequelize instance
console.log('Sequelize instance type:', typeof sequelize);
console.log('Is Sequelize instance:', sequelize instanceof Object);
console.log('Has define method:', typeof sequelize.define === 'function');

// Import routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import promotionRoutes from './routes/promotion.routes';
import socialMediaRoutes from './routes/socialMedia.routes';
import dashboardRoutes from './routes/dashboard.routes';

// Create Express app
const app = express();

// Set up middleware
app.use(helmet());
// Configure CORS to allow requests from frontend
app.use(cors({
  origin: '*', // Allow requests from any origin for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' })); // Increase limit for large images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));
app.use(passport.initialize());

// Initialize database connection
const setupDatabase = async () => {
  try {
    await initDatabase();
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

// Initialize database
setupDatabase();

// Set up routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to BoostFlow API',
    version: '1.0.0',
  });
});

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, async () => {
  // Initialize database connection
  try {
    await initDatabase();
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}); 