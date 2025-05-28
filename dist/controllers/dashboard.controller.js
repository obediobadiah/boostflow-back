"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPromotionStatsByMonth = exports.getProductStatsByMonth = exports.getMonthlyProductStatistics = exports.getDashboardData = exports.trackProductView = exports.getActivePromotions = exports.getActiveProducts = exports.getPromotionStatistics = exports.getProductStatistics = void 0;
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
// Get product statistics
const getProductStatistics = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        let totalProducts = 0;
        if (userRole === 'admin') {
            totalProducts = await models_1.Product.count();
        }
        else {
            totalProducts = await models_1.Product.count({
                where: {
                    active: true
                }
            });
        }
        res.status(200).json({
            totalProducts
        });
    }
    catch (error) {
        console.error('Error fetching product statistics:', error);
        res.status(500).json({
            message: 'Error fetching product statistics',
            error: error.message
        });
    }
};
exports.getProductStatistics = getProductStatistics;
// Get promotion statistics
const getPromotionStatistics = async (req, res) => {
    try {
        const userId = req.user?.id;
        const promotions = await models_1.Promotion.findAll({
            where: {
                promoterId: userId
            }
        });
        // Calculate totals manually
        let clicksGenerated = 0;
        let conversions = 0;
        let earnings = 0;
        promotions.forEach((promo) => {
            clicksGenerated += promo.clicks || 0;
            conversions += promo.conversions || 0;
            earnings += promo.earnings || 0;
        });
        res.status(200).json({
            totalPromotions: promotions.length,
            clicksGenerated,
            earnings,
            conversions
        });
    }
    catch (error) {
        console.error('Error fetching promotion statistics:', error);
        res.status(500).json({
            message: 'Error fetching promotion statistics',
            error: error.message
        });
    }
};
exports.getPromotionStatistics = getPromotionStatistics;
// Get active products with pagination
const getActiveProducts = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;
        // Build the where condition based on user role
        let whereCondition;
        if (userRole === 'admin') {
            // Admin can see all products
            whereCondition = {};
        }
        else {
            // Non-admin users can only see active products
            whereCondition = {
                active: true,
            };
        }
        const { count, rows: products } = await models_1.Product.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: models_1.User,
                    as: 'owner',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'role']
                }
            ],
            offset,
            limit,
            order: [['createdAt', 'DESC']]
        });
        const totalPages = Math.ceil(count / limit);
        // Transform data to match frontend expectations
        const formattedProducts = products.map((product) => {
            const owner = product.owner;
            // Format the owner name using firstName and lastName
            let ownerName = 'Unknown';
            if (owner) {
                ownerName = `${owner.firstName || ''} ${owner.lastName || ''}`.trim();
                if (owner.role === 'admin') {
                    ownerName = 'Admin';
                }
            }
            return {
                id: product.id,
                name: product.name,
                price: `$${product.price || 0}`,
                category: product.category || 'Other',
                commissionRate: product.commissionType === 'percentage' ?
                    `${product.commissionRate || 0}%` :
                    `$${product.commissionRate || 0}`,
                description: product.description || '',
                active: product.active,
                ownerId: owner?.id || null,
                ownerName: ownerName
            };
        });
        res.status(200).json({
            data: formattedProducts,
            total: count,
            page,
            limit,
            totalPages
        });
    }
    catch (error) {
        console.error('Error fetching active products:', error);
        res.status(500).json({
            message: 'Error fetching active products',
            error: error.message
        });
    }
};
exports.getActiveProducts = getActiveProducts;
// Get active promotions with pagination
const getActivePromotions = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;
        // Build the where condition based on user role
        let whereCondition = { status: 'active' };
        if (userRole !== 'admin') {
            whereCondition = {
                ...whereCondition,
                promoterId: userId
            };
        }
        const { count, rows: promotions } = await models_1.Promotion.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: models_1.Product,
                    as: 'product',
                    include: [
                        {
                            model: models_1.User,
                            as: 'owner',
                            attributes: ['id', 'firstName', 'lastName', 'email']
                        }
                    ]
                },
                {
                    model: models_1.User,
                    as: 'promoter',
                    attributes: ['id', 'firstName', 'lastName', 'email']
                }
            ],
            offset,
            limit,
            order: [['createdAt', 'DESC']]
        });
        const totalPages = Math.ceil(count / limit);
        res.status(200).json({
            data: promotions,
            total: count,
            page,
            limit,
            totalPages
        });
    }
    catch (error) {
        console.error('Error fetching active promotions:', error);
        res.status(500).json({
            message: 'Error fetching active promotions',
            error: error.message
        });
    }
};
exports.getActivePromotions = getActivePromotions;
// Track product view
const trackProductView = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user?.id;
        if (!productId) {
            return res.status(400).json({ message: 'Product ID is required' });
        }
        // Record the product view
        await models_1.ProductView.create({
            productId,
            userId,
            timestamp: new Date()
        });
        res.status(200).json({ message: 'Product view tracked successfully' });
    }
    catch (error) {
        console.error('Error tracking product view:', error);
        res.status(500).json({
            message: 'Error tracking product view',
            error: error.message
        });
    }
};
exports.trackProductView = trackProductView;
// Get dashboard data
const getDashboardData = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        // Get user information
        const user = await models_1.User.findByPk(userId);
        // Get stats based on user role
        if (userRole === 'business' || userRole === 'admin') {
            // For business users, get product stats
            const productStats = await (0, exports.getProductStatistics)(req, {});
            const activeProductsData = await (0, exports.getActiveProducts)(req, {});
            res.status(200).json({
                user,
                stats: {
                    products: productStats
                },
                recentProducts: activeProductsData
            });
        }
        else if (userRole === 'promoter') {
            // For promoters, get promotion stats
            const promotionStats = await (0, exports.getPromotionStatistics)(req, {});
            const activePromotionsData = await (0, exports.getActivePromotions)(req, {});
            res.status(200).json({
                user,
                stats: {
                    promotions: promotionStats
                },
                recentPromotions: activePromotionsData
            });
        }
        else {
            res.status(403).json({ message: 'Unauthorized role' });
        }
    }
    catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).json({
            message: 'Error fetching dashboard data',
            error: error.message
        });
    }
};
exports.getDashboardData = getDashboardData;
// Get monthly product statistics
const getMonthlyProductStatistics = async (req, res) => {
    try {
        const userId = req.user?.id;
        // Get current date
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1; // JavaScript months are 0-indexed
        // Get data for the current month
        const productStatsData = await (0, exports.getProductStatsByMonth)({ ...req, params: { year: currentYear.toString(), month: currentMonth.toString() } }, {});
        res.status(200).json(productStatsData);
    }
    catch (error) {
        console.error('Error fetching monthly product statistics:', error);
        res.status(500).json({
            message: 'Error fetching monthly product statistics',
            error: error.message
        });
    }
};
exports.getMonthlyProductStatistics = getMonthlyProductStatistics;
// Get product statistics by month
const getProductStatsByMonth = async (req, res) => {
    try {
        const { year, month } = req.params;
        const userId = req.user?.id;
        // Validate year and month
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ message: 'Invalid year or month' });
        }
        // Get the start and end date for the given month
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0);
        // Get product view data
        const productViews = await models_1.ProductView.findAll({
            where: {
                timestamp: {
                    [sequelize_1.Op.between]: [startDate, endDate]
                }
            },
            include: [
                {
                    model: models_1.Product,
                    as: 'product',
                    where: {
                        ownerId: userId
                    }
                }
            ]
        });
        // Organize data by week
        const weeklyData = {};
        productViews.forEach((view) => {
            const viewDate = new Date(view.timestamp);
            const weekNumber = getWeekNumberInMonth(viewDate, startDate);
            if (!weeklyData[weekNumber]) {
                weeklyData[weekNumber] = {
                    views: 0
                };
            }
            weeklyData[weekNumber].views += 1;
        });
        // Convert to array format for frontend
        const weeksInMonth = getWeeksInMonth(yearNum, monthNum - 1);
        const result = [];
        for (let i = 1; i <= weeksInMonth; i++) {
            result.push({
                week: i,
                views: weeklyData[i]?.views || 0
            });
        }
        return res.status(200).json({
            year: yearNum,
            month: monthNum,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching product statistics by month:', error);
        return res.status(500).json({
            message: 'Error fetching product statistics by month',
            error: error.message
        });
    }
};
exports.getProductStatsByMonth = getProductStatsByMonth;
// Get promotion statistics by month
const getPromotionStatsByMonth = async (req, res) => {
    try {
        const { year, month } = req.params;
        const userId = req.user?.id;
        // Validate year and month
        const yearNum = parseInt(year);
        const monthNum = parseInt(month);
        if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
            return res.status(400).json({ message: 'Invalid year or month' });
        }
        // Get the start and end date for the given month
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0);
        // Get promotion click data
        const promotionClicks = await models_1.PromotionClick.findAll({
            where: {
                timestamp: {
                    [sequelize_1.Op.between]: [startDate, endDate]
                }
            },
            include: [
                {
                    model: models_1.Promotion,
                    as: 'promotion',
                    where: {
                        promoterId: userId
                    }
                }
            ]
        });
        // Organize data by week
        const weeklyData = {};
        promotionClicks.forEach((click) => {
            const clickDate = new Date(click.timestamp);
            const weekNumber = getWeekNumberInMonth(clickDate, startDate);
            if (!weeklyData[weekNumber]) {
                weeklyData[weekNumber] = {
                    clicks: 0,
                    conversions: 0
                };
            }
            weeklyData[weekNumber].clicks += 1;
            if (click.isConversion) {
                weeklyData[weekNumber].conversions += 1;
            }
        });
        // Convert to array format for frontend
        const weeksInMonth = getWeeksInMonth(yearNum, monthNum - 1);
        const result = [];
        for (let i = 1; i <= weeksInMonth; i++) {
            result.push({
                week: i,
                clicks: weeklyData[i]?.clicks || 0,
                conversions: weeklyData[i]?.conversions || 0
            });
        }
        return res.status(200).json({
            year: yearNum,
            month: monthNum,
            data: result
        });
    }
    catch (error) {
        console.error('Error fetching promotion statistics by month:', error);
        return res.status(500).json({
            message: 'Error fetching promotion statistics by month',
            error: error.message
        });
    }
};
exports.getPromotionStatsByMonth = getPromotionStatsByMonth;
// Helper function to get the number of weeks in a month
function getWeeksInMonth(year, month) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    // Calculate the number of weeks
    const firstWeek = getWeekNumberInYear(firstDay);
    const lastWeek = getWeekNumberInYear(lastDay);
    return lastWeek - firstWeek + 1;
}
// Helper function to get the week number in a year
function getWeekNumberInYear(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}
// Helper function to get the week number in a month
function getWeekNumberInMonth(date, monthStart) {
    const firstDay = new Date(monthStart);
    const dayOfMonth = date.getDate();
    const dayOfWeek = date.getDay();
    // Calculate the first day of the first week
    const firstDayOfFirstWeek = firstDay.getDate() - firstDay.getDay();
    // Calculate the week number
    return Math.ceil((dayOfMonth - firstDayOfFirstWeek) / 7);
}
