"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const models_1 = require("../models");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Middleware to check if user is authenticated
const authenticate = passport_1.default.authenticate('jwt', { session: false });
// Validation middleware for social media accounts
const validateSocialMediaAccount = [
    (0, express_validator_1.body)('platform').isIn(['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'linkedin', 'pinterest', 'other']).withMessage('Invalid platform'),
    (0, express_validator_1.body)('username').notEmpty().withMessage('Username is required'),
    (0, express_validator_1.body)('accountId').notEmpty().withMessage('Account ID is required'),
    (0, express_validator_1.body)('accessToken').optional().isString().withMessage('Access token must be a string'),
    (0, express_validator_1.body)('refreshToken').optional().isString().withMessage('Refresh token must be a string'),
    (0, express_validator_1.body)('tokenExpiry').optional().isISO8601().withMessage('Token expiry must be a valid date'),
    (0, express_validator_1.body)('followerCount').optional().isNumeric().withMessage('Follower count must be a number'),
];
// Get all social media accounts for the authenticated user
router.get('/my', authenticate, async (req, res, next) => {
    try {
        const user = req.user;
        const accounts = await models_1.SocialMediaAccount.findAll({
            where: { userId: user.id }
        });
        res.json(accounts);
    }
    catch (error) {
        next(error);
    }
});
// Get a specific social media account by ID
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const account = await models_1.SocialMediaAccount.findOne({
            where: {
                id,
                userId: user.id
            }
        });
        if (!account) {
            return res.status(404).json({ message: 'Social media account not found' });
        }
        res.json(account);
    }
    catch (error) {
        next(error);
    }
});
// Create a new social media account
router.post('/', authenticate, validateSocialMediaAccount, async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const user = req.user;
        const { platform, username, accountId, accessToken, refreshToken, tokenExpiry, followerCount } = req.body;
        // Check if user already has an account for this platform
        const existingAccount = await models_1.SocialMediaAccount.findOne({
            where: {
                userId: user.id,
                platform
            }
        });
        if (existingAccount) {
            return res.status(400).json({ message: `You already have a ${platform} account connected` });
        }
        // Create the social media account
        const account = await models_1.SocialMediaAccount.create({
            userId: user.id,
            platform,
            username,
            accountId,
            accessToken,
            refreshToken,
            tokenExpiry: tokenExpiry || null,
            isConnected: true,
            connectionDate: new Date(),
            followerCount: followerCount || 0,
            metadata: {}
        });
        // Remove sensitive data before sending response
        const accountData = account.get({ plain: true });
        delete accountData.accessToken;
        delete accountData.refreshToken;
        res.status(201).json({
            message: 'Social media account connected successfully',
            account: accountData
        });
    }
    catch (error) {
        next(error);
    }
});
// Update a social media account
router.put('/:id', authenticate, validateSocialMediaAccount, async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        const user = req.user;
        // Find the account
        const account = await models_1.SocialMediaAccount.findOne({
            where: {
                id,
                userId: user.id
            }
        });
        if (!account) {
            return res.status(404).json({ message: 'Social media account not found' });
        }
        const { username, accountId, accessToken, refreshToken, tokenExpiry, followerCount, isConnected } = req.body;
        // Update the account
        await account.update({
            username: username || account.get('username'),
            accountId: accountId || account.get('accountId'),
            accessToken: accessToken || account.get('accessToken'),
            refreshToken: refreshToken || account.get('refreshToken'),
            tokenExpiry: tokenExpiry || account.get('tokenExpiry'),
            isConnected: isConnected !== undefined ? isConnected : account.get('isConnected'),
            followerCount: followerCount || account.get('followerCount')
        });
        // Remove sensitive data before sending response
        const accountData = account.get({ plain: true });
        delete accountData.accessToken;
        delete accountData.refreshToken;
        res.json({
            message: 'Social media account updated successfully',
            account: accountData
        });
    }
    catch (error) {
        next(error);
    }
});
// Disconnect a social media account
router.put('/:id/disconnect', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;
        // Find the account
        const account = await models_1.SocialMediaAccount.findOne({
            where: {
                id,
                userId: user.id
            }
        });
        if (!account) {
            return res.status(404).json({ message: 'Social media account not found' });
        }
        // Update the account
        await account.update({
            isConnected: false,
            accessToken: '',
            refreshToken: '',
            tokenExpiry: undefined
        });
        res.json({
            message: 'Social media account disconnected successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
// Delete a social media account
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;
        // Find the account
        const account = await models_1.SocialMediaAccount.findOne({
            where: {
                id,
                userId: user.id
            }
        });
        if (!account) {
            return res.status(404).json({ message: 'Social media account not found' });
        }
        // Delete the account
        await account.destroy();
        res.json({
            message: 'Social media account deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
