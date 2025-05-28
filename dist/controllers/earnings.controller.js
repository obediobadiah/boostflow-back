"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEarningsByPromotion = exports.updateEarningsStatus = exports.createEarnings = exports.getEarningsStats = exports.getUserEarnings = void 0;
const earnings_model_1 = require("../models/earnings.model");
const promotion_model_1 = __importDefault(require("../models/promotion.model"));
const sequelize_1 = require("sequelize");
const models_1 = require("models");
// Get user's earnings
const getUserEarnings = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { startDate, endDate, status } = req.query;
        const whereClause = { userId };
        if (startDate && endDate) {
            whereClause.createdAt = {
                [sequelize_1.Op.between]: [new Date(startDate), new Date(endDate)]
            };
        }
        if (status) {
            whereClause.status = status;
        }
        const earnings = await earnings_model_1.Earnings.findAll({
            where: whereClause,
            include: [{
                    model: promotion_model_1.default,
                    as: 'promotion',
                    attributes: ['name', 'commissionRate', 'commissionType']
                }],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({
            success: true,
            data: earnings
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
};
exports.getUserEarnings = getUserEarnings;
// Get earnings statistics
const getEarningsStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { year, month } = req.query;
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);
        // Get total earnings for the month
        const totalEarnings = await earnings_model_1.Earnings.sum('amount', {
            where: {
                userId,
                createdAt: {
                    [sequelize_1.Op.between]: [startDate, endDate]
                },
                status: 'paid'
            }
        });
        // Get earnings by week
        const weeklyEarnings = await earnings_model_1.Earnings.findAll({
            attributes: [
                [models_1.sequelize.fn('date_trunc', 'week', models_1.sequelize.col('createdAt')), 'week'],
                [models_1.sequelize.fn('sum', models_1.sequelize.col('amount')), 'total']
            ],
            where: {
                userId,
                createdAt: {
                    [sequelize_1.Op.between]: [startDate, endDate]
                },
                status: 'paid'
            },
            group: [models_1.sequelize.fn('date_trunc', 'week', models_1.sequelize.col('createdAt'))],
            order: [[models_1.sequelize.fn('date_trunc', 'week', models_1.sequelize.col('createdAt')), 'ASC']]
        });
        // Get previous month's earnings for comparison
        const prevStartDate = new Date(parseInt(year), parseInt(month) - 2, 1);
        const prevEndDate = new Date(parseInt(year), parseInt(month) - 1, 0);
        const prevMonthEarnings = await earnings_model_1.Earnings.sum('amount', {
            where: {
                userId,
                createdAt: {
                    [sequelize_1.Op.between]: [prevStartDate, prevEndDate]
                },
                status: 'paid'
            }
        });
        // Calculate percentage change
        const earningsPercentChange = prevMonthEarnings > 0
            ? ((totalEarnings - prevMonthEarnings) / prevMonthEarnings * 100).toFixed(2)
            : '100';
        res.status(200).json({
            success: true,
            data: {
                totalEarnings: totalEarnings || 0,
                weeklyEarnings,
                prevMonthEarnings: prevMonthEarnings || 0,
                earningsPercentChange
            }
        });
    }
    catch (error) {
        console.error('Error fetching earnings statistics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching earnings statistics',
            error: error.message
        });
    }
};
exports.getEarningsStats = getEarningsStats;
// Create new earnings record
const createEarnings = async (req, res) => {
    try {
        const { promotionId, amount, type, description } = req.body;
        const userId = req.user?.id;
        if (!userId || !promotionId || !amount) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields'
            });
        }
        const earnings = await earnings_model_1.Earnings.create({
            userId,
            promotionId,
            amount,
            type: type || 'commission',
            status: 'pending',
            description
        });
        res.status(201).json({
            success: true,
            data: earnings
        });
    }
    catch (error) {
        console.error('Error creating earnings record:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating earnings record',
            error: error.message
        });
    }
};
exports.createEarnings = createEarnings;
// Update earnings status
const updateEarningsStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, paymentDate } = req.body;
        const userId = req.user?.id;
        const earnings = await earnings_model_1.Earnings.findOne({
            where: { id, userId }
        });
        if (!earnings) {
            return res.status(404).json({
                success: false,
                message: 'Earnings record not found'
            });
        }
        await earnings.update({
            status,
            paymentDate: status === 'paid' ? paymentDate || new Date() : null
        });
        res.status(200).json({
            success: true,
            data: earnings
        });
    }
    catch (error) {
        console.error('Error updating earnings status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating earnings status',
            error: error.message
        });
    }
};
exports.updateEarningsStatus = updateEarningsStatus;
// Get earnings by promotion
const getEarningsByPromotion = async (req, res) => {
    try {
        const { promotionId } = req.params;
        const userId = req.user?.id;
        const earnings = await earnings_model_1.Earnings.findAll({
            where: {
                promotionId,
                userId
            },
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({
            success: true,
            data: earnings
        });
    }
    catch (error) {
        console.error('Error fetching earnings by promotion:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching earnings by promotion',
            error: error.message
        });
    }
};
exports.getEarningsByPromotion = getEarningsByPromotion;
