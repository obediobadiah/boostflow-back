"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const earnings_model_1 = require("../models/earnings.model");
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
const earnings_controller_1 = require("../controllers/earnings.controller");
const router = express_1.default.Router();
// Apply auth middleware to all routes
router.use(auth_middleware_1.authenticate);
// Get user's earnings with pagination
router.get('/user', (async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const offset = (page - 1) * limit;
        const { count, rows: earnings } = await earnings_model_1.Earnings.findAndCountAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        const totalPages = Math.ceil(count / limit);
        res.json({
            success: true,
            data: {
                earnings,
                total: count,
                page,
                limit,
                totalPages
            }
        });
    }
    catch (error) {
        console.error('Error fetching user earnings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching earnings',
            error: error.message
        });
    }
}));
// Get earnings statistics
router.get('/stats', (async (req, res) => {
    try {
        const userId = req.user.id;
        // Get total earnings
        const totalEarnings = await earnings_model_1.Earnings.sum('amount', {
            where: { userId }
        });
        // Get earnings by status
        const pendingEarnings = await earnings_model_1.Earnings.sum('amount', {
            where: {
                userId,
                status: 'pending'
            }
        });
        const paidEarnings = await earnings_model_1.Earnings.sum('amount', {
            where: {
                userId,
                status: 'paid'
            }
        });
        const cancelledEarnings = await earnings_model_1.Earnings.sum('amount', {
            where: {
                userId,
                status: 'cancelled'
            }
        });
        // Get monthly earnings for the last 12 months
        const monthlyEarnings = await earnings_model_1.Earnings.findAll({
            attributes: [
                [database_1.default.fn('date_trunc', 'month', database_1.default.col('createdAt')), 'month'],
                [database_1.default.fn('sum', database_1.default.col('amount')), 'amount']
            ],
            where: {
                userId,
                createdAt: {
                    [sequelize_1.Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12))
                }
            },
            group: [database_1.default.fn('date_trunc', 'month', database_1.default.col('createdAt'))],
            order: [[database_1.default.fn('date_trunc', 'month', database_1.default.col('createdAt')), 'ASC']],
            raw: true
        });
        // Format monthly earnings data
        const formattedMonthlyEarnings = monthlyEarnings.map(item => ({
            month: new Date(item.month).toLocaleString('default', { month: 'short', year: 'numeric' }),
            amount: parseFloat(item.amount)
        }));
        res.json({
            success: true,
            data: {
                totalEarnings: totalEarnings || 0,
                pendingEarnings: pendingEarnings || 0,
                paidEarnings: paidEarnings || 0,
                cancelledEarnings: cancelledEarnings || 0,
                monthlyEarnings: formattedMonthlyEarnings
            }
        });
    }
    catch (error) {
        console.error('Error fetching earnings stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching earnings statistics',
            error: error.message
        });
    }
}));
// Get earnings by date range
router.get('/range', (async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '10');
        const offset = (page - 1) * limit;
        const whereClause = { userId };
        if (startDate && endDate) {
            whereClause.createdAt = {
                [sequelize_1.Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }
        const { count, rows: earnings } = await earnings_model_1.Earnings.findAndCountAll({
            where: whereClause,
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        const totalPages = Math.ceil(count / limit);
        res.json({
            success: true,
            data: {
                earnings,
                total: count,
                page,
                limit,
                totalPages
            }
        });
    }
    catch (error) {
        console.error('Error fetching earnings by date range:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching earnings',
            error: error.message
        });
    }
}));
// Create new earnings record
router.post('/', earnings_controller_1.createEarnings);
// Update earnings status
router.patch('/:id/status', earnings_controller_1.updateEarningsStatus);
// Get earnings by promotion
router.get('/promotion/:promotionId', earnings_controller_1.getEarningsByPromotion);
exports.default = router;
