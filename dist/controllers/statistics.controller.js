"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlatformStatistics = exports.getActivePromotions = exports.getDashboardStats = void 0;
const database_1 = __importDefault(require("../config/database"));
const product_model_1 = __importDefault(require("../models/product.model"));
const promotion_model_1 = __importDefault(require("../models/promotion.model"));
const socialMediaAccount_model_1 = __importDefault(require("../models/socialMediaAccount.model"));
// Get dashboard statistics
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Get total promotions
        const totalPromotions = await promotion_model_1.default.count({
            where: { promoterId: userId }
        });
        // Get total clicks and conversions
        const promotionStats = await promotion_model_1.default.findOne({
            attributes: [
                [database_1.default.fn('SUM', database_1.default.col('clicks')), 'totalClicks'],
                [database_1.default.fn('SUM', database_1.default.col('conversions')), 'totalConversions'],
                [database_1.default.fn('SUM', database_1.default.col('earnings')), 'totalEarnings']
            ],
            where: { promoterId: userId },
            raw: true
        });
        // Calculate changes from previous period (mock data for now)
        const change = {
            promotions: '+5',
            clicks: '+12%',
            earnings: '+28%',
            conversions: '+4'
        };
        res.json({
            totalPromotions: totalPromotions || 0,
            clicksGenerated: parseInt(String(promotionStats?.totalClicks || '0')),
            earnings: parseFloat(String(promotionStats?.totalEarnings || '0')),
            conversions: parseInt(String(promotionStats?.totalConversions || '0')),
            change
        });
    }
    catch (error) {
        console.error('Error getting dashboard stats:', error);
        res.status(500).json({ message: 'Failed to get dashboard statistics' });
    }
};
exports.getDashboardStats = getDashboardStats;
// Get active promotions
const getActivePromotions = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const promotions = await promotion_model_1.default.findAll({
            attributes: ['id', 'clicks', 'conversions', 'commissionRate', 'commissionType'],
            where: {
                promoterId: userId,
                status: 'active'
            },
            include: [{
                    model: product_model_1.default,
                    attributes: ['name']
                }],
            limit: 5,
            order: [['clicks', 'DESC']]
        });
        const formattedPromotions = promotions.map((promotion) => {
            const product = promotion.getDataValue('Product');
            const commissionRate = promotion.getDataValue('commissionRate');
            const commissionType = promotion.getDataValue('commissionType');
            // Format commission based on type
            const commission = commissionType === 'percentage'
                ? `${commissionRate}% per sale`
                : `$${commissionRate} per sale`;
            return {
                id: promotion.getDataValue('id'),
                name: product ? product.getDataValue('name') : 'Unknown Product',
                commission,
                clicks: promotion.getDataValue('clicks'),
                conversions: promotion.getDataValue('conversions')
            };
        });
        res.json(formattedPromotions);
    }
    catch (error) {
        console.error('Error getting active promotions:', error);
        res.status(500).json({ message: 'Failed to get active promotions' });
    }
};
exports.getActivePromotions = getActivePromotions;
// Get platform statistics
const getPlatformStatistics = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        // Get count by platform
        const platforms = await socialMediaAccount_model_1.default.findAll({
            attributes: [
                'platform',
                [database_1.default.fn('COUNT', database_1.default.col('id')), 'count'],
                [database_1.default.fn('SUM', database_1.default.col('followerCount')), 'followers']
            ],
            where: { userId },
            group: ['platform']
        });
        // Calculate total accounts and followers
        let totalAccounts = 0;
        let totalFollowers = 0;
        let mostPopularPlatform = '';
        let highestCount = 0;
        // Initialize platform counts
        const platformCount = {
            facebook: 0,
            instagram: 0,
            twitter: 0,
            tiktok: 0,
            youtube: 0,
            linkedin: 0,
            pinterest: 0,
            other: 0
        };
        // Process data
        platforms.forEach((platform) => {
            const platformName = platform.getDataValue('platform');
            const count = parseInt(platform.getDataValue('count') || '0');
            const followers = parseInt(platform.getDataValue('followers') || '0');
            // Update platform count
            if (platformName in platformCount) {
                platformCount[platformName] = count;
            }
            else {
                platformCount.other += count;
            }
            // Track totals
            totalAccounts += count;
            totalFollowers += followers;
            // Find most popular platform
            if (count > highestCount) {
                highestCount = count;
                mostPopularPlatform = platformName;
            }
        });
        res.json({
            platformCount,
            totalAccounts,
            totalFollowers,
            mostPopularPlatform
        });
    }
    catch (error) {
        console.error('Error getting platform statistics:', error);
        res.status(500).json({ message: 'Failed to get platform statistics' });
    }
};
exports.getPlatformStatistics = getPlatformStatistics;
