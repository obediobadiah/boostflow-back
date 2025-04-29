import express, { RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { 
  getDashboardStats, 
  getActivePromotions, 
  getPlatformStatistics 
} from '../controllers/statistics.controller';

const router = express.Router();

// All routes require authentication
router.use(authenticate as RequestHandler);

// Get dashboard statistics
router.get('/dashboard', getDashboardStats as RequestHandler);

// Get active promotions
router.get('/active-promotions', getActivePromotions as RequestHandler);

// Get platform statistics
router.get('/platforms', getPlatformStatistics as RequestHandler);

export default router; 