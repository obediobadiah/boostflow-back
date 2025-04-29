"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateObjectId = exports.validate = void 0;
/**
 * Validation middleware factory
 * Creates a middleware function that validates request data against schema
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, {
            abortEarly: false,
            stripUnknown: true,
        });
        if (error) {
            const errors = error.details.map((detail) => ({
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
exports.validate = validate;
/**
 * ID parameter validation middleware
 * Checks if the provided ID is a valid MongoDB ObjectId
 */
const validateObjectId = (req, res, next) => {
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
exports.validateObjectId = validateObjectId;
