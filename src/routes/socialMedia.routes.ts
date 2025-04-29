import express, { Request as ExpressRequest, Response, NextFunction } from 'express';
import passport from 'passport';
import { SocialMediaAccount, User } from '../models';
import { body, validationResult } from 'express-validator';

// Define request types with proper params and body
interface Request extends ExpressRequest {
  user?: any;
  params: any;
  body: any;
}

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
router.get('/my', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;
    
    const accounts = await SocialMediaAccount.findAll({
      where: { userId: user.id }
    });
    
    res.json(accounts);
  } catch (error) {
    next(error);
  }
});

// Get a specific social media account by ID
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    
    const account = await SocialMediaAccount.findOne({
      where: { 
        id,
        userId: user.id
      }
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Social media account not found' });
    }
    
    res.json(account);
  } catch (error) {
    next(error);
  }
});

// Create a new social media account
router.post('/', authenticate, validateSocialMediaAccount, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = req.user as any;
    const { 
      platform, 
      username, 
      accountId, 
      accessToken, 
      refreshToken, 
      tokenExpiry,
      followerCount 
    } = req.body;
    
    // Check if user already has an account for this platform
    const existingAccount = await SocialMediaAccount.findOne({
      where: {
        userId: user.id,
        platform
      }
    });
    
    if (existingAccount) {
      return res.status(400).json({ message: `You already have a ${platform} account connected` });
    }
    
    // Create the social media account
    const account = await SocialMediaAccount.create({
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
  } catch (error) {
    next(error);
  }
});

// Update a social media account
router.put('/:id', authenticate, validateSocialMediaAccount, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const user = req.user as any;
    
    // Find the account
    const account = await SocialMediaAccount.findOne({
      where: {
        id,
        userId: user.id
      }
    });
    
    if (!account) {
      return res.status(404).json({ message: 'Social media account not found' });
    }
    
    const { 
      username, 
      accountId, 
      accessToken, 
      refreshToken, 
      tokenExpiry,
      followerCount,
      isConnected 
    } = req.body;
    
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
  } catch (error) {
    next(error);
  }
});

// Disconnect a social media account
router.put('/:id/disconnect', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    
    // Find the account
    const account = await SocialMediaAccount.findOne({
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
  } catch (error) {
    next(error);
  }
});

// Delete a social media account
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    
    // Find the account
    const account = await SocialMediaAccount.findOne({
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
  } catch (error) {
    next(error);
  }
});

export default router; 