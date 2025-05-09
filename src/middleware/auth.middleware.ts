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
      return res.status(401).json({ message: 'No authorization header provided' });
    }
    
    // Check if Authorization header has correct format
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Invalid authorization header format' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token || token.trim() === '') {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
      
      if (!decoded || !decoded.id) {
        return res.status(401).json({ message: 'Invalid token payload' });
      }
      
      const user = await User.findByPk(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Add user to request
      reqAny.user = user;
      
      next();
    } catch (jwtError: any) {
      console.error('Token verification error:', jwtError);
      return res.status(401).json({ 
        message: 'Invalid token',
        error: jwtError.message 
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Server error during authentication' });
  }
}; 