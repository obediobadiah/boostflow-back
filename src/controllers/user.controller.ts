import { Request, Response } from 'express';
import { User, SocialMediaAccount } from '../models';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database';
import { Op } from 'sequelize';

// Extended Request interfaces
interface UserIdRequest extends Request {
  params: {
    id: string;
  };
  user?: any;
}

interface UserProfileRequest extends Request {
  body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    profilePicture?: string;
  };
  user?: any;
}

interface PasswordChangeRequest extends Request {
  body: {
    currentPassword: string;
    newPassword: string;
  };
  user?: any;
}

// Get user profile by ID
export const getUserById = async (req: UserIdRequest, res: Response) => {
  try {
    const userId = req.params.id;
    
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [{
        model: SocialMediaAccount,
        as: 'socialMediaAccounts'
      }]
    });
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }
    
    res.status(200).json({
      user,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

// Update user profile
export const updateProfile = async (req: UserProfileRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { firstName, lastName, email, profilePicture } = req.body;
    
    // Check if email is already taken by another user
    if (email) {
      const existingUser = await User.findOne({ 
        where: { 
          email, 
          id: { [Op.ne]: userId } 
        }
      });
      
      if (existingUser) {
        return res.status(400).json({
          message: 'Email is already in use by another account',
        });
      }
    }
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }
    
    await user.update({
      firstName,
      lastName,
      email,
      profilePicture
    });
    
    // Get updated user without password
    const updatedUser = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    });
    
    res.status(200).json({
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error updating profile',
      error: error.message,
    });
  }
};

// Change password
export const changePassword = async (req: PasswordChangeRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    
    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current password and new password are required',
      });
    }
    
    // Get user with password
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        message: 'User not found',
      });
    }
    
    // Check if current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Current password is incorrect',
      });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await user.update({
      password: hashedPassword
    });
    
    res.status(200).json({
      message: 'Password changed successfully',
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error changing password',
      error: error.message,
    });
  }
}; 