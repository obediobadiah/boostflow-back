import { Request as ExpressRequest, Response, NextFunction } from 'express';
import { SocialMediaAccount } from '../models';
import { validationResult } from 'express-validator';

// Define request types with proper params and body
interface Request extends ExpressRequest {
  user?: any;
  params: any;
  body: any;
}

// Get all social media accounts for the authenticated user
export const getSocialMediaAccounts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;
    
    const accounts = await SocialMediaAccount.findAll({
      where: { userId: user.id }
    });
    
    res.json(accounts);
  } catch (error) {
    next(error);
  }
};

// Get a specific social media account by ID
export const getSocialMediaAccount = async (req: Request, res: Response, next: NextFunction) => {
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
};

// Create a new social media account
export const createSocialMediaAccount = async (req: Request, res: Response, next: NextFunction) => {
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
      tokenExpiry: tokenExpiry || undefined,
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
};

// Update a social media account
export const updateSocialMediaAccount = async (req: Request, res: Response, next: NextFunction) => {
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
};

// Disconnect a social media account
export const disconnectSocialMediaAccount = async (req: Request, res: Response, next: NextFunction) => {
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
};

// Delete a social media account
export const deleteSocialMediaAccount = async (req: Request, res: Response, next: NextFunction) => {
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
}; 