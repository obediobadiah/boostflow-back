import { Request as ExpressRequest, Response, NextFunction } from 'express';

// Add proper interface for Express request with originalUrl
interface Request extends ExpressRequest {
  originalUrl: string;
}

// Handle 404 errors
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Custom error interface to include status code
interface ApiError extends Error {
  statusCode?: number;
  code?: string;
}

// Global error handler
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    res.status(400).json({
      message: 'Validation Error',
      errors: (err as any).errors.map((e: any) => ({
        field: e.path,
        message: e.message,
      })),
    });
    return;
  }

  // Get status code from error if it exists, or use response status or fallback to 500
  const statusCode = err.statusCode || res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    code: err.code || 'UNKNOWN_ERROR',
  });
};

/**
 * Custom error class for application errors
 */
export class AppException extends Error {
  statusCode: number;
  isOperational: boolean;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async handler for wrapping async route handlers
 * This eliminates the need for try/catch blocks in route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 