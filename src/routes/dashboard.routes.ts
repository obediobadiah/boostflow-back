import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getProductStatistics,
  getPromotionStatistics,
  getActiveProducts,
  getActivePromotions,
  trackProductView,
  getMonthlyProductStatistics,
  getDashboardData,
  getProductStatsByMonth,
  getPromotionStatsByMonth,
} from '../controllers/dashboard.controller';

const router = Router();

// All dashboard routes require authentication
router.use(authenticate as any);

// Product and Promotion statistics
router.get('/statistics/products', getProductStatistics as any);
router.get('/statistics/promotions', getPromotionStatistics as any);
router.get('/statistics/products/monthly', getMonthlyProductStatistics as any);

// Track product views
router.post('/products/track-view', trackProductView as any);

// Get active products and promotions with pagination
router.get('/products/active', getActiveProducts as any);
router.get('/promotions/active', getActivePromotions as any);

// Get dashboard data
router.get('/', getDashboardData as any);

// Get product statistics by month
router.get('/products/stats/:year/:month', getProductStatsByMonth as any);

// Get promotion statistics by month
router.get('/promotions/stats/:year/:month', getPromotionStatsByMonth as any);

export default router; 