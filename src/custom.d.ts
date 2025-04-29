import { IUser } from './models/user.model';

// Module augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// Declare module types for TypeScript
declare module './routes/auth.routes';
declare module './routes/user.routes';
declare module './routes/product.routes';
declare module './routes/promotion.routes';
declare module './routes/socialMedia.routes'; 