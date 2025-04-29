"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const models_1 = require("../models");
const passport_1 = __importDefault(require("passport"));
const router = express_1.default.Router();
// Middleware
const authenticate = passport_1.default.authenticate('jwt', { session: false });
// Routes
router.get('/', authenticate, (async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        console.log('User requesting promotions:', {
            userId: req.user.id,
            role: req.user.role
        });
        // Check if user is admin
        const isAdmin = req.user.role === 'admin';
        // For admin users, get all promotions
        if (isAdmin) {
            console.log('Admin user - fetching all promotions');
            const promotions = await models_1.Promotion.findAll({
                include: [
                    {
                        model: models_1.Product,
                        as: 'product',
                        include: [
                            {
                                model: models_1.User,
                                as: 'owner',
                                attributes: ['id', 'name', 'email']
                            }
                        ]
                    },
                    {
                        model: models_1.User,
                        as: 'promoter',
                        attributes: ['id', 'name', 'email', 'role']
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            console.log(`Found ${promotions.length} promotions for admin`);
            return res.json({
                count: promotions.length,
                promotions,
                isAdmin: true
            });
        }
        // For regular users, only get their own promotions
        console.log('Regular user - fetching own promotions');
        const promotions = await models_1.Promotion.findAll({
            where: { promoterId: req.user.id },
            include: [
                {
                    model: models_1.Product,
                    as: 'product',
                    include: [
                        {
                            model: models_1.User,
                            as: 'owner',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                },
                {
                    model: models_1.User,
                    as: 'promoter',
                    attributes: ['id', 'name', 'email', 'role']
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        console.log(`Found ${promotions.length} promotions for user ${req.user.id}`);
        res.json({
            count: promotions.length,
            promotions,
            isAdmin: false
        });
    }
    catch (error) {
        console.error('Error fetching promotions:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });
        res.status(500).json({
            error: 'Failed to fetch promotions',
            details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
        });
    }
}));
router.post('/', authenticate, (async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        console.log('Received promotion request:', {
            userId: req.user.id,
            body: req.body
        });
        const { productId, trackingCode, commissionRate, commissionType, description, customImages, autoPostToSocial, affiliateLink, } = req.body;
        if (!productId) {
            return res.status(400).json({ error: 'Missing required field: productId' });
        }
        // Convert productId to number if it's a string
        const productIdNum = typeof productId === 'string' ? parseInt(productId, 10) : productId;
        console.log('Looking up product:', productIdNum);
        // Fetch the product to get its details
        const product = await models_1.Product.findByPk(productIdNum);
        if (!product) {
            console.log('Product not found:', productIdNum);
            return res.status(404).json({ error: 'Product not found' });
        }
        console.log('Found product:', {
            id: product.id,
            name: product.name,
            commissionRate: product.commissionRate,
            commissionType: product.commissionType
        });
        // Generate a tracking code if not provided
        const generatedTrackingCode = trackingCode || `PROMO-${Date.now().toString(36)}`;
        // Use provided affiliate link or generate one
        const finalAffiliateLink = affiliateLink || product.affiliateLink || `https://yourdomain.com/ref/${generatedTrackingCode}`;
        // Use product's commission rate/type if not provided
        const finalCommissionRate = commissionRate || product.commissionRate;
        const finalCommissionType = commissionType || product.commissionType;
        console.log('Checking for existing promotion:', {
            productId: productIdNum,
            promoterId: req.user.id
        });
        const existingPromotion = await models_1.Promotion.findOne({
            where: {
                productId: productIdNum,
                promoterId: req.user.id
            }
        });
        if (existingPromotion) {
            console.log('Promotion already exists:', existingPromotion.id);
            return res.status(400).json({ message: 'You are already promoting this product' });
        }
        console.log('Creating promotion with:', {
            productId: productIdNum,
            promoterId: req.user.id,
            trackingCode: generatedTrackingCode,
            commissionRate: finalCommissionRate,
            commissionType: finalCommissionType,
            description: description || product.description,
            customImages: customImages || product.images,
            autoPostToSocial: autoPostToSocial ?? false,
            affiliateLink: finalAffiliateLink
        });
        const promotion = await models_1.Promotion.create({
            productId: productIdNum,
            promoterId: req.user.id,
            trackingCode: generatedTrackingCode,
            commissionRate: finalCommissionRate,
            commissionType: finalCommissionType,
            description: description || product.description,
            customImages: customImages || product.images,
            autoPostToSocial: autoPostToSocial ?? false,
            status: 'active',
            clicks: 0,
            conversions: 0,
            earnings: 0,
            affiliateLink: finalAffiliateLink
        });
        console.log('Promotion created successfully:', promotion.id);
        const promotionWithProduct = await models_1.Promotion.findByPk(promotion.id, {
            include: [
                {
                    model: models_1.Product,
                    as: 'product',
                    include: [
                        {
                            model: models_1.User,
                            as: 'owner',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                }
            ]
        });
        res.status(201).json(promotionWithProduct);
    }
    catch (error) {
        console.error('Error creating promotion:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            body: req.body
        });
        res.status(500).json({
            error: 'Failed to create promotion',
            details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
        });
    }
}));
router.get('/:id', authenticate, (async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!req.params.id) {
            return res.status(400).json({ error: 'Promotion ID is required' });
        }
        const promotion = await models_1.Promotion.findOne({
            where: {
                id: parseInt(req.params.id),
                promoterId: req.user.id
            },
            include: [
                {
                    model: models_1.Product,
                    as: 'product',
                    include: [
                        {
                            model: models_1.User,
                            as: 'owner',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                }
            ]
        });
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        res.json(promotion);
    }
    catch (error) {
        console.error('Error fetching promotion:', error);
        res.status(500).json({ error: 'Failed to fetch promotion' });
    }
}));
router.put('/:id', authenticate, (async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!req.params.id) {
            return res.status(400).json({ error: 'Promotion ID is required' });
        }
        const { description, customImages, autoPostToSocial, status, affiliateLink } = req.body;
        const promotion = await models_1.Promotion.findOne({
            where: {
                id: parseInt(req.params.id),
                promoterId: req.user.id
            }
        });
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        await promotion.update({
            description,
            customImages,
            autoPostToSocial,
            status,
            affiliateLink
        });
        const updatedPromotion = await models_1.Promotion.findByPk(promotion.id, {
            include: [
                {
                    model: models_1.Product,
                    as: 'product',
                    include: [
                        {
                            model: models_1.User,
                            as: 'owner',
                            attributes: ['id', 'name', 'email']
                        }
                    ]
                }
            ]
        });
        res.json(updatedPromotion);
    }
    catch (error) {
        console.error('Error updating promotion:', error);
        res.status(500).json({ error: 'Failed to update promotion' });
    }
}));
router.delete('/:id', authenticate, (async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ error: 'User not authenticated' });
        }
        if (!req.params.id) {
            return res.status(400).json({ error: 'Promotion ID is required' });
        }
        const promotion = await models_1.Promotion.findOne({
            where: {
                id: parseInt(req.params.id),
                promoterId: req.user.id
            }
        });
        if (!promotion) {
            return res.status(404).json({ error: 'Promotion not found' });
        }
        await promotion.destroy();
        res.json({ message: 'Promotion deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting promotion:', error);
        res.status(500).json({ error: 'Failed to delete promotion' });
    }
}));
exports.default = router;
