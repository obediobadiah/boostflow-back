import express from 'express';
import passport from 'passport';
import { body } from 'express-validator';
import { 
  getSocialMediaAccounts, 
  getSocialMediaAccount, 
  createSocialMediaAccount, 
  updateSocialMediaAccount, 
  disconnectSocialMediaAccount, 
  deleteSocialMediaAccount 
} from '../controllers/socialMedia.controller';

const router = express.Router();

// Middleware to check if user is authenticated
const authenticate = passport.authenticate('jwt', { session: false });

// Validation middleware for social media accounts
const validateSocialMediaAccount = [
  body('platform').isIn(['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'linkedin', 'pinterest', 'other']).withMessage('Invalid platform'),
  body('username').notEmpty().withMessage('Username is required'),
  body('accountId').notEmpty().withMessage('Account ID is required'),
  body('accessToken').optional().isString().withMessage('Access token must be a string'),
  body('refreshToken').optional().isString().withMessage('Refresh token must be a string'),
  body('tokenExpiry').optional().isISO8601().withMessage('Token expiry must be a valid date'),
  body('followerCount').optional().isNumeric().withMessage('Follower count must be a number'),
];

// Get all social media accounts for the authenticated user
router.get('/my', authenticate, getSocialMediaAccounts as any);

// Get a specific social media account by ID
router.get('/:id', authenticate, getSocialMediaAccount as any);

// Create a new social media account
router.post('/', authenticate, validateSocialMediaAccount, createSocialMediaAccount as any);

// Update a social media account
router.put('/:id', authenticate, validateSocialMediaAccount, updateSocialMediaAccount as any);

// Disconnect a social media account
router.put('/:id/disconnect', authenticate, disconnectSocialMediaAccount as any);

// Delete a social media account
router.delete('/:id', authenticate, deleteSocialMediaAccount as any);

export default router; 