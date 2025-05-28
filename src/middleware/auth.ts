import { Response, NextFunction } from 'express';
import { Request as ExpressRequest } from 'express-serve-static-core';
import jwt from 'jsonwebtoken';
import { User } from '../models';

interface JwtPayload {
  id: number;
}

interface AuthenticatedRequest extends ExpressRequest {
  user?: {
    id: number;
    firstName: string;
    email: string;
  };
}

export const authenticateToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
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

      req.user = { id: user.id, firstName: user.firstName, email: user.email };
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