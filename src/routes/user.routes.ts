import express, { Request as ExpressRequest, Response, NextFunction } from 'express';
import passport from 'passport';
import { User } from '../models';
import { body, validationResult } from 'express-validator';

const router = express.Router();

interface Request extends ExpressRequest {
  user?: any;
  body: any;
  params: any;
}

// Middleware to check if user is authenticated
const authenticate = passport.authenticate('jwt', { session: false });

// Middleware to check if user is an admin
const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  const user = req.user as any;
  if (user && user.role === 'admin') {
    return next();
  }
  res.status(403).json({ message: 'Access denied. Admin role required.' });
  return;
};

// Update user profile validation
const validateProfileUpdate = [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('profilePicture').optional().isURL().withMessage('Profile picture must be a valid URL'),
];

// User object to return in responses (in getUserData function or similar)
// This might be named differently in your codebase
const mapUserResponse = (user: any) => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    active: user.active,
    profilePicture: user.profilePicture,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
};

// Get all users (admin only)
router.get('/', authenticate, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'profilePicture', 'active', 'createdAt']
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, {
      attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'profilePicture', 'active', 'createdAt']
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Update user profile
router.put(
  '/profile',
  authenticate,
  validateProfileUpdate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const user = req.user as any;
      const { firstName, lastName, email, profilePicture } = req.body;
      
      // Only update the fields that were sent
      const updateData: any = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (email) updateData.email = email;
      if (profilePicture) updateData.profilePicture = profilePicture;
      
      // Update user in database
      await User.update(updateData, { where: { id: user.id } });
      
      // Get updated user data
      const updatedUser = await User.findByPk(user.id, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'profilePicture', 'createdAt']
      });
      
      res.json({ 
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
);

// Change password
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const user = req.user as any;
      const { currentPassword, newPassword } = req.body;
      
      // Get user from database to have access to instance methods
      const dbUser = await User.findByPk(user.id);
      if (!dbUser) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Verify current password
      const isMatch = await dbUser.comparePassword(currentPassword);
      if (!isMatch) {
        res.status(400).json({ message: 'Current password is incorrect' });
        return;
      }
      
      // Update password
      dbUser.password = newPassword;
      await dbUser.save();
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      next(error);
    }
  }
);

// Delete account (self)
router.delete('/account', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as any;
    
    // Delete user
    await User.destroy({ where: { id: user.id } });
    
    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Update user role (admin only)
router.put(
  '/:id/role',
  authenticate,
  isAdmin,
  [
    body('role').isIn(['admin', 'business', 'promoter']).withMessage('Role must be admin, business, or promoter')
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const { role } = req.body;
      
      // Ensure the user exists
      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Update role in database
      await User.update({ role }, { where: { id } });
      
      // Get updated user data
      const updatedUser = await User.findByPk(id, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'profilePicture', 'active', 'createdAt', 'updatedAt']
      });
      
      res.json({ 
        message: 'User role updated successfully',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
);

// Update user (admin only)
router.put(
  '/:id',
  authenticate,
  isAdmin,
  validateProfileUpdate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { id } = req.params;
      const { firstName, lastName, email, role, active, password } = req.body;
      
      // Ensure the user exists
      const user = await User.findByPk(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      // Create update payload without password
      const updateData: any = {};
      if (firstName !== undefined) updateData.firstName = firstName;
      if (lastName !== undefined) updateData.lastName = lastName;
      if (email !== undefined) updateData.email = email;
      if (role !== undefined) updateData.role = role;
      if (active !== undefined) updateData.active = active;
      
      // Update user in database
      await User.update(updateData, { where: { id } });
      
      // If password is provided, update it separately using the User instance
      if (password) {
        // Get user instance to trigger the password hash hook
        const userInstance = await User.findByPk(id);
        if (userInstance) {
          userInstance.password = password;
          await userInstance.save();
        }
      }
      
      // Get updated user data
      const updatedUser = await User.findByPk(id, {
        attributes: ['id', 'firstName', 'lastName', 'email', 'role', 'profilePicture', 'active', 'createdAt', 'updatedAt']
      });
      
      res.json({ 
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      next(error);
    }
  }
);

// Delete user (admin only)
router.delete('/:id', authenticate, isAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const adminId = (req.user as any).id;
    
    // Prevent admin from deleting themselves
    if (id.toString() === adminId.toString()) {
      res.status(400).json({ message: 'Cannot delete your own admin account' });
      return;
    }
    
    // Ensure the user exists
    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    // Delete user
    await User.destroy({ where: { id } });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router; 