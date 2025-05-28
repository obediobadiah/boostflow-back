"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const express_validator_1 = require("express-validator");
const socialMedia_controller_1 = require("../controllers/socialMedia.controller");
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
router.get('/my', authenticate, socialMedia_controller_1.getSocialMediaAccounts);
// Get a specific social media account by ID
router.get('/:id', authenticate, socialMedia_controller_1.getSocialMediaAccount);
// Create a new social media account
router.post('/', authenticate, validateSocialMediaAccount, socialMedia_controller_1.createSocialMediaAccount);
// Update a social media account
router.put('/:id', authenticate, validateSocialMediaAccount, socialMedia_controller_1.updateSocialMediaAccount);
// Disconnect a social media account
router.put('/:id/disconnect', authenticate, socialMedia_controller_1.disconnectSocialMediaAccount);
// Delete a social media account
router.delete('/:id', authenticate, socialMedia_controller_1.deleteSocialMediaAccount);
exports.default = router;
