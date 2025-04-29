import { Request as ExpressRequest, Response, NextFunction } from 'express';

// Define a custom Request type
type CustomRequest = ExpressRequest & {
  body: any;
  params: {
    id?: string;
    productId?: string;
    userId?: string;
    promotionId?: string;
    [key: string]: string | undefined;
  };
}

/**
 * Validation middleware factory
 * Creates a middleware function that validates request data against schema
 */
export const validate = (schema: any) => {
  return (req: CustomRequest, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail: any) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));

      return res.status(400).json({
        message: 'Validation error',
        errors,
      });
    }

    next();
  };
};

/**
 * ID parameter validation middleware
 * Checks if the provided ID is a valid MongoDB ObjectId
 */
export const validateObjectId = (req: CustomRequest, res: Response, next: NextFunction) => {
  const idParam = req.params.id || req.params.productId || req.params.userId || req.params.promotionId;
  
  if (!idParam) {
    return next(); // No ID parameter found, skip validation
  }
  
  // Check if ID is valid MongoDB ObjectId (24 hex characters)
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  
  if (!objectIdPattern.test(idParam)) {
    return res.status(400).json({
      message: 'Invalid ID format',
    });
  }
  
  next();
}; 