import express from 'express';
import cors from 'cors';
import passport from 'passport';
import { errorHandler, notFound } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import promotionRoutes from './routes/promotion.routes';
import earningsRoutes from './routes/earnings.routes';
import socialMediaRoutes from './routes/socialMedia.routes';
import dashboardRoutes from './routes/dashboard.routes';
import './config/passport';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/earnings', earningsRoutes);
app.use('/api/social-media', socialMediaRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

export default app; 