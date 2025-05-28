import { Response, NextFunction } from 'express';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';

interface JwtPayload {
  id: number;
}

// @ts-ignore - Ignoring TypeScript errors for this file
export const authenticateToken = async (req: any, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      res.status(401).json({ message: 'Authentication failed: No auth token' });
      return;
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication failed: Invalid token format' });
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token || token.trim() === '') {
      res.status(401).json({ message: 'Authentication failed: Empty token' });
      return;
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as JwtPayload;
      
      if (!decoded || !decoded.id) {
        res.status(401).json({ message: 'Authentication failed: Invalid token payload' });
        return;
      }
      
      const user = await User.findByPk(decoded.id);

      if (!user) {
        res.status(401).json({ message: 'Authentication failed: User not found' });
        return;
      }

      // Set user object on request
      req.user = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      };
      next();
    } catch (jwtError: any) {
      res.status(401).json({ 
        message: 'Authentication failed: Invalid token',
        error: jwtError.message 
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during authentication' });
  }
}; 