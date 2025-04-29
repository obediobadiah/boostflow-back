import { Express } from 'express';

declare global {
  namespace Express {
    interface User {
      id: string | number;
      name: string;
      email: string;
      role?: string;
    }
    
    // Add Request body interface
    interface Request {
      body: any;
      params: any;
    }
  }
}

declare module 'express-serve-static-core' {
  interface RequestHandler {
    // Allow RequestHandler to return any Promise
    (req: Request, res: Response, next: NextFunction): Promise<any> | any;
  }
}

export {}; 