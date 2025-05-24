import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { User } from '../models';
import bcrypt from 'bcryptjs';
import { emailService } from '../services/email.service';
import { UserAttributes, UserInstance } from '../models/user.model';

// Extend the Express Request type to include body
interface ExtendedRequest extends Request {
  body: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    company?: string;
    website?: string;
    bio?: string;
    role?: string;
  };
}

// Define a type for the user object
interface AuthUserAttributes {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role?: string;
  password: string;
  profilePicture?: string;
}

// Register a new user
export const register = async (req: ExtendedRequest, res: Response) => {
  try {
    const { firstName, lastName, email, password, phone, company, website, bio, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phone,
      company,
      website,
      bio,
      role: 'business' as 'admin' | 'business' | 'promoter',
      active: true,
    });

    // Generate JWT token
    const token = generateToken(user);

    // Return user without password
    const userWithoutPassword = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      company: user.company,
      website: user.website,
      bio: user.bio,
      role: user.role,
    };

    // Send confirmation email
    const emailResult = await emailService.sendConfirmationEmail(`${firstName} ${lastName}`, email);
    
    // Include email preview URL in development mode
    const emailInfo = process.env.NODE_ENV === 'development' 
      ? { emailPreviewUrl: emailResult.previewUrl }
      : {};

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token,
      ...emailInfo
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Error registering user',
      error: error.message,
    });
  }
};

// Login user
export const login = (req: ExtendedRequest, res: Response) => {
  passport.authenticate('local', { session: false }, (err: any, user: UserInstance, info: any) => {
    if (err) {
      return res.status(500).json({
        message: 'Authentication error',
        error: err.message,
      });
    }

    if (!user) {
      return res.status(401).json({
        message: info?.message || 'Invalid email or password',
      });
    }

    // Check if user account is active
    if (user.active === false) {
      return res.status(403).json({
        message: 'Your account has been deactivated. Please contact support for assistance.'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user without password
    const userWithoutPassword = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      active: user.active
    };

    res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      token,
    });
  })(req, res);
};

// Get current user
export const getCurrentUser = (req: Request, res: Response) => {
  const user = req.user as any;
  
  // Return user without password
  const userWithoutPassword = {
    id: user.id,
    name: user.firstName + ' ' + user.lastName,
    email: user.email,
    role: user.role,
    profilePicture: user.profilePicture,
    socialMediaAccounts: user.socialMediaAccounts,
  };

  res.status(200).json({
    user: userWithoutPassword,
  });
};

// Helper function to generate JWT token
const generateToken = (user: UserInstance) => {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      role: user.role 
    },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
}; 