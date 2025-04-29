"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSocialMediaPost = exports.trackConversion = exports.trackClick = exports.getPromotionsByProduct = exports.getPromotionsByPromoter = exports.createPromotion = void 0;
const models_1 = require("../models");
const crypto = __importStar(require("crypto"));
// Implementation of generateTrackingCode to avoid import issues
const generateTrackingCode = async () => {
    // Generate a random string
    const randomBytes = crypto.randomBytes(8).toString('hex');
    // Create a tracking code with a prefix
    const trackingCode = `BF-${randomBytes}`;
    // Check if it already exists
    const existingPromotion = await models_1.Promotion.findOne({
        where: { trackingCode }
    });
    // If exists, generate a new one recursively
    if (existingPromotion) {
        return generateTrackingCode();
    }
    return trackingCode;
};
// Create a new promotion
const createPromotion = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId, affiliateLink, description, customImages, autoPostToSocial } = req.body;
        console.log('Creating promotion with data:', {
            userId,
            productId,
            affiliateLink,
            description,
            customImages,
            autoPostToSocial
        });
        // Check if product exists
        const product = await models_1.Product.findByPk(productId);
        if (!product) {
            console.log('Product not found:', productId);
            return res.status(404).json({
                message: 'Product not found'
            });
        }
        // Check if promotion already exists for this product and promoter
        const existingPromotion = await models_1.Promotion.findOne({
            where: {
                productId,
                promoterId: userId
            }
        });
        if (existingPromotion) {
            console.log('Promotion already exists:', { productId, userId });
            return res.status(400).json({
                message: 'You are already promoting this product',
                promotion: existingPromotion
            });
        }
        // Create new promotion
        const trackingCode = await generateTrackingCode();
        const promotionData = {
            productId,
            promoterId: userId,
            trackingCode,
            commissionRate: product.commissionRate,
            commissionType: product.commissionType,
            affiliateLink: affiliateLink || product.affiliateLink,
            description: description || product.description,
            customImages: customImages || product.images,
            autoPostToSocial: autoPostToSocial || false,
            status: 'active',
            clicks: 0,
            conversions: 0,
            earnings: 0
        };
        console.log('Creating promotion with data:', promotionData);
        const promotion = await models_1.Promotion.create(promotionData);
        // If autoPostToSocial is true, post to connected social media accounts
        if (autoPostToSocial) {
            await postToSocialMedia(userId, promotion);
        }
        console.log('Promotion created successfully:', promotion.id);
        res.status(201).json({
            message: 'Promotion created successfully',
            promotion
        });
    }
    catch (error) {
        console.error('Error creating promotion:', {
            error: error.message,
            stack: error.stack,
            data: req.body
        });
        res.status(500).json({
            message: 'Error creating promotion',
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
exports.createPromotion = createPromotion;
// Get promotions by promoter
const getPromotionsByPromoter = async (req, res) => {
    try {
        const userId = req.user.id;
        const promotions = await models_1.Promotion.findAll({
            where: { promoterId: userId },
            include: [models_1.Product],
            order: [['createdAt', 'DESC']]
        });
        res.status(200).json({
            count: promotions.length,
            promotions
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error fetching promotions',
            error: error.message
        });
    }
};
exports.getPromotionsByPromoter = getPromotionsByPromoter;
// Get promotions by product
const getPromotionsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;
        // Check if product exists and user is the owner
        const product = await models_1.Product.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }
        if (product.ownerId !== userId) {
            return res.status(403).json({
                message: 'Not authorized to view this product\'s promotions'
            });
        }
        const promotions = await models_1.Promotion.findAll({
            where: { productId },
            include: [{
                    model: models_1.User,
                    as: 'promoter',
                    attributes: ['id', 'name', 'email', 'profilePicture']
                }],
            order: [['clicks', 'DESC']]
        });
        res.status(200).json({
            count: promotions.length,
            promotions
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error fetching product promotions',
            error: error.message
        });
    }
};
exports.getPromotionsByProduct = getPromotionsByProduct;
// Track click
const trackClick = async (req, res) => {
    try {
        const { trackingCode } = req.params;
        const promotion = await models_1.Promotion.findOne({
            where: { trackingCode }
        });
        if (!promotion) {
            return res.status(404).json({
                message: 'Promotion not found'
            });
        }
        // Increment clicks
        await promotion.update({
            clicks: promotion.clicks + 1
        });
        res.status(200).json({
            message: 'Click tracked successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error tracking click',
            error: error.message
        });
    }
};
exports.trackClick = trackClick;
// Track conversion
const trackConversion = async (req, res) => {
    try {
        const { trackingCode } = req.params;
        const { saleAmount } = req.body;
        const promotion = await models_1.Promotion.findOne({
            where: { trackingCode }
        });
        if (!promotion) {
            return res.status(404).json({
                message: 'Promotion not found'
            });
        }
        // Calculate new earnings based on commission type
        let newEarnings = promotion.earnings;
        if (promotion.commissionType === 'percentage' && saleAmount) {
            newEarnings += (saleAmount * promotion.commissionRate) / 100;
        }
        else if (promotion.commissionType === 'fixed') {
            newEarnings += promotion.commissionRate;
        }
        // Update promotion
        await promotion.update({
            conversions: promotion.conversions + 1,
            earnings: newEarnings
        });
        const updatedPromotion = await models_1.Promotion.findByPk(promotion.id);
        res.status(200).json({
            message: 'Conversion tracked successfully',
            promotion: updatedPromotion
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error tracking conversion',
            error: error.message
        });
    }
};
exports.trackConversion = trackConversion;
// Post to social media accounts
const postToSocialMedia = async (userId, promotion) => {
    try {
        // Get all social media accounts for the user
        const socialMediaAccounts = await models_1.SocialMediaAccount.findAll({
            where: {
                userId,
                isConnected: true
            }
        });
        if (socialMediaAccounts.length === 0) {
            return;
        }
        // Get product details
        const product = await models_1.Product.findByPk(promotion.productId);
        if (!product) {
            return;
        }
        // For each social media account, create a post
        for (const account of socialMediaAccounts) {
            // Create content based on platform
            let content = '';
            let images = promotion.customImages && promotion.customImages.length > 0
                ? promotion.customImages
                : product.images;
            const description = promotion.description || product.description;
            const truncatedDesc = description.length > 100
                ? `${description.substring(0, 97)}...`
                : description;
            // Generate different content based on platform
            switch (account.platform) {
                case 'twitter':
                    content = `Check out this amazing product: ${truncatedDesc} Use my link: ${promotion.affiliateLink}`;
                    break;
                case 'facebook':
                case 'instagram':
                    content = `🔥 PRODUCT ALERT! 🔥\n\n${description}\n\nGet it now using my special link: ${promotion.affiliateLink}`;
                    break;
                case 'linkedin':
                    content = `I'm excited to share this great product with my network!\n\n${description}\n\nCheck it out: ${promotion.affiliateLink}`;
                    break;
                default:
                    content = `Check out this product: ${description}\n\nUse my link: ${promotion.affiliateLink}`;
            }
            // Create the social media post
            await models_1.SocialMediaPost.create({
                promotionId: promotion.id,
                platform: account.platform,
                postUrl: '', // Will be updated after actual posting
                postId: '', // Will be updated after actual posting
                postDate: new Date(),
                content,
                images,
                clicks: 0,
                conversions: 0
            }); // Use type assertion to handle type mismatch temporarily
            // Here you would integrate with the actual social media APIs
            // This is where integration with specific social platform APIs would go
            // For now, we're just creating the records in our database
        }
    }
    catch (error) {
        console.error('Error posting to social media:', error);
    }
};
// Add social media post to promotion
const addSocialMediaPost = async (req, res) => {
    try {
        const { promotionId } = req.params;
        const userId = req.user.id;
        const { platform, postUrl, postId, postDate, content, images } = req.body;
        // Check if promotion exists and user is the promoter
        const promotion = await models_1.Promotion.findByPk(parseInt(promotionId));
        if (!promotion) {
            return res.status(404).json({
                message: 'Promotion not found'
            });
        }
        if (promotion.promoterId !== userId) {
            return res.status(403).json({
                message: 'Not authorized to add a post to this promotion'
            });
        }
        // Create a new social media post
        await models_1.SocialMediaPost.create({
            promotionId: parseInt(promotionId),
            platform,
            postUrl,
            postId: postId || '',
            postDate: postDate || new Date(),
            content,
            images,
            clicks: 0,
            conversions: 0
        }); // Type assertion to bypass the strict type checking
        const updatedPromotion = await models_1.Promotion.findByPk(parseInt(promotionId), {
            include: [{
                    model: models_1.SocialMediaPost,
                    as: 'socialMediaPosts'
                }]
        });
        res.status(200).json({
            message: 'Social media post added successfully',
            promotion: updatedPromotion
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error adding social media post',
            error: error.message
        });
    }
};
exports.addSocialMediaPost = addSocialMediaPost;
