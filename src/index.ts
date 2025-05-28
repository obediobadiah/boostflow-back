import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import passport from 'passport';
import './config/passport';
import { errorHandler, notFound } from './middleware/error.middleware';
import { initDatabase } from './models';
import app from './app';

// Load environment variables
dotenv.config();

// Configure additional middleware not included in app.ts
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
  origin: '*', // Allow requests from any origin for development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(express.json({ limit: '50mb' })); // Increase limit for large images
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to BoostFlow API',
    version: '1.0.0',
  });
});

// Initialize database
(async () => {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
})();

// Start server if not being imported (for local development)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export the Express app for serverless environments
export default app;
module.exports = app; 