import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

interface JwtPayload {
  id: number;
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Cast req to any to avoid TypeScript errors with headers
    const reqAny = req as any;
    const authHeader = reqAny.headers.authorization;
    
    // Check if Authorization header exists
    if (!authHeader) {
      console.log('No auth header provided for:', reqAny.method, reqAny.url);
      return res.status(401).json({ message: 'Authentication failed: No auth token' });
    }
    
    // Check if Authorization header has correct format
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format for:', reqAny.method, reqAny.url, 'Header:', authHeader);
      return res.status(401).json({ message: 'Authentication failed: Invalid token format' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token || token.trim() === '') {
      console.log('Empty token provided for:', reqAny.method, reqAny.url);
      return res.status(401).json({ message: 'Authentication failed: Empty token' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
      
      if (!decoded || !decoded.id) {
        console.log('Invalid token payload for:', reqAny.method, reqAny.url, 'Decoded:', decoded);
        return res.status(401).json({ message: 'Authentication failed: Invalid token payload' });
      }
      
      const user = await User.findByPk(decoded.id);
      if (!user) {
        console.log('User not found for token payload:', decoded);
        return res.status(401).json({ message: 'Authentication failed: User not found' });
      }

      // Add user to request
      reqAny.user = user;
      
      next();
    } catch (jwtError: any) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({ 
        message: 'Authentication failed: Invalid token',
        error: jwtError.message 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
}; 