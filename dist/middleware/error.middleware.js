"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.AppException = exports.errorHandler = exports.notFound = void 0;
// Handle 404 errors
const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};
exports.notFound = notFound;
// Global error handler
const errorHandler = (err, req, res, next) => {
    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        res.status(400).json({
            message: 'Validation Error',
            errors: err.errors.map((e) => ({
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
exports.errorHandler = errorHandler;
/**
 * Custom error class for application errors
 */
class AppException extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.AppException = AppException;
/**
 * Async handler for wrapping async route handlers
 * This eliminates the need for try/catch blocks in route handlers
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
