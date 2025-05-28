"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = (0, express_1.Router)();
// All dashboard routes require authentication
router.use(auth_middleware_1.authenticate);
// Product and Promotion statistics
router.get('/statistics/products', dashboard_controller_1.getProductStatistics);
router.get('/statistics/promotions', dashboard_controller_1.getPromotionStatistics);
router.get('/statistics/products/monthly', dashboard_controller_1.getMonthlyProductStatistics);
// Track product views
router.post('/products/track-view', dashboard_controller_1.trackProductView);
// Get active products and promotions with pagination
router.get('/products/active', dashboard_controller_1.getActiveProducts);
router.get('/promotions/active', dashboard_controller_1.getActivePromotions);
// Get dashboard data
router.get('/', dashboard_controller_1.getDashboardData);
// Get product statistics by month
router.get('/products/stats/:year/:month', dashboard_controller_1.getProductStatsByMonth);
// Get promotion statistics by month
router.get('/promotions/stats/:year/:month', dashboard_controller_1.getPromotionStatsByMonth);
exports.default = router;
