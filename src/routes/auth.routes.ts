import express from 'express';
import type { Request as ExpressRequest, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import { User } from '../models';
import { body, validationResult } from 'express-validator';
import cors from 'cors';

// Define custom Request type with body and user
interface Request extends ExpressRequest {
  user?: any;
  body: any;
  params: any;
  headers: any;
}

const router = express.Router();

// Enable CORS for all routes
router.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
  credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));

// Validation middleware
const validateRegister = [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('website').optional().isURL().withMessage('Website must be a valid URL'),
];

const validateLogin = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

// Generate JWT token for user
const generateToken = (user: any) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: '7d' }
  );
};

// User object to return in responses
const getUserData = (user: any) => {
  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role,
    active: user.active,
    profilePicture: user.profilePicture,
  };
};

// Define the expected structure of the request body
// interface RegisterRequestBody {
//   name: string;
//   email: string;
//   password: string;
//   role?: string;
// }

// Registration route
router.post(
  '/register',
  validateRegister,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { firstName, lastName, email, password, phone, company, website, bio, role } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({ message: 'User already exists' });
        return;
      }

      // Create new user
      const user = await User.create({
        firstName,
        lastName,
        email,
        password, // Password will be hashed by the model hook
        phone,
        company,
        website,
        bio,
        role: role || 'business',
      });

      // Generate JWT token
      const token = generateToken(user);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          company: user.company,
          website: user.website,
          bio: user.bio,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// Login route
router.post('/login', validateLogin, (req: Request, res: Response, next: NextFunction) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return;
  }

  passport.authenticate('local', { session: false }, (err: Error, user: any, info: any) => {
    if (err) {
      return next(err);
    }

    if (!user) {
      res.status(401).json({ message: info.message || 'Authentication failed' });
      return;
    }

    // Check if user account is active
    if (user.active === false) {
      return res.status(403).json({
        message: 'Your account has been deactivated. Please contact support for assistance.'
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: getUserData(user),
    });
  })(req, res, next);
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  (req: Request, res: Response) => {
    const user = req.user as any;
    const token = generateToken(user);
    
    // Log the redirect and token information
    console.log('Google authentication successful, redirecting to frontend with token');
    
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];
    const redirectUrl = allowedOrigins.includes('*') ? `http://localhost:3000/auth/callback?token=${token}` : `http://${allowedOrigins[0]}/auth/callback?token=${token}`;
    console.log('Redirecting to:', redirectUrl);
    
    // Redirect to frontend with token
    res.redirect(redirectUrl);
  }
);

// Get current user route (protected)
router.get('/me', passport.authenticate('jwt', { session: false }), (req: Request, res: Response) => {
  const user = req.user;
  res.json(getUserData(user));
});

export default router; 