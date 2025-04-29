// Custom Express declarations to fix route handler return type issues
import 'express';
import { Request as ExpressRequest, Response, NextFunction } from 'express';
import { UserInstance } from '../models/user.model';

// Override Express RequestHandler to allow any Promise return type
declare module 'express' {
  interface RequestHandler {
    // Allow any return type from route handlers
    (req: Request, res: Response, next: NextFunction): any;
  }
}

declare global {
  namespace Express {
    interface Request extends ExpressRequest {
      user?: UserInstance;
    }
  }
}

declare module 'express' {
  interface Request {
    user?: any;
  }
  
  interface Response {
    [key: string]: any;
  }
  
  export interface RequestHandler {
    // Allow any return type from route handlers
    (req: Request, res: Response, next: NextFunction): any;
  }
}

// Override the RequestHandler to allow returning Promise of any type
declare module 'express-serve-static-core' {
  interface RequestHandler {
    (req: Request, res: Response, next: NextFunction): any;
  }
} 