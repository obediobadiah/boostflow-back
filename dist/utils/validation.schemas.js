"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addSocialMediaPostSchema = exports.trackConversionSchema = exports.createPromotionSchema = exports.updateProductSchema = exports.createProductSchema = exports.changePasswordSchema = exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = void 0;
const joi_1 = __importDefault(require("joi"));
// User validation schemas
exports.registerSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50).required()
        .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required',
    }),
    email: joi_1.default.string().email().required()
        .messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required',
    }),
    password: joi_1.default.string().min(6).required()
        .messages({
        'string.min': 'Password must be at least 6 characters long',
        'any.required': 'Password is required',
    }),
    role: joi_1.default.string().valid('business', 'promoter').default('business')
        .messages({
        'any.only': 'Role must be either "business" or "promoter"',
    }),
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required()
        .messages({
        'string.email': 'Email must be a valid email address',
        'any.required': 'Email is required',
    }),
    password: joi_1.default.string().required()
        .messages({
        'any.required': 'Password is required',
    }),
});
exports.updateProfileSchema = joi_1.default.object({
    name: joi_1.default.string().min(2).max(50)
        .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters',
    }),
    email: joi_1.default.string().email()
        .messages({
        'string.email': 'Email must be a valid email address',
    }),
    profilePicture: joi_1.default.string().uri().allow(null, '')
        .messages({
        'string.uri': 'Profile picture must be a valid URL',
    }),
});
exports.changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required()
        .messages({
        'any.required': 'Current password is required',
    }),
    newPassword: joi_1.default.string().min(6).required()
        .messages({
        'string.min': 'New password must be at least 6 characters long',
        'any.required': 'New password is required',
    }),
});
// Product validation schemas
exports.createProductSchema = joi_1.default.object({
    name: joi_1.default.string().min(3).max(100).required()
        .messages({
        'string.min': 'Product name must be at least 3 characters long',
        'string.max': 'Product name cannot exceed 100 characters',
        'any.required': 'Product name is required',
    }),
    description: joi_1.default.string().min(10).max(2000).required()
        .messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 2000 characters',
        'any.required': 'Description is required',
    }),
    price: joi_1.default.number().min(0).required()
        .messages({
        'number.min': 'Price cannot be negative',
        'any.required': 'Price is required',
    }),
    category: joi_1.default.string().required()
        .messages({
        'any.required': 'Category is required',
    }),
    commissionRate: joi_1.default.number().min(0).required()
        .messages({
        'number.min': 'Commission rate cannot be negative',
        'any.required': 'Commission rate is required',
    }),
    commissionType: joi_1.default.string().valid('percentage', 'fixed').required()
        .messages({
        'any.only': 'Commission type must be either "percentage" or "fixed"',
        'any.required': 'Commission type is required',
    }),
    images: joi_1.default.array().items(joi_1.default.string().uri()).min(1)
        .messages({
        'array.min': 'At least one product image is required',
        'string.uri': 'Image must be a valid URL',
    }),
    active: joi_1.default.boolean().default(true),
});
exports.updateProductSchema = joi_1.default.object({
    name: joi_1.default.string().min(3).max(100)
        .messages({
        'string.min': 'Product name must be at least 3 characters long',
        'string.max': 'Product name cannot exceed 100 characters',
    }),
    description: joi_1.default.string().min(10).max(2000)
        .messages({
        'string.min': 'Description must be at least 10 characters long',
        'string.max': 'Description cannot exceed 2000 characters',
    }),
    price: joi_1.default.number().min(0)
        .messages({
        'number.min': 'Price cannot be negative',
    }),
    category: joi_1.default.string(),
    commissionRate: joi_1.default.number().min(0)
        .messages({
        'number.min': 'Commission rate cannot be negative',
    }),
    commissionType: joi_1.default.string().valid('percentage', 'fixed')
        .messages({
        'any.only': 'Commission type must be either "percentage" or "fixed"',
    }),
    images: joi_1.default.array().items(joi_1.default.string().uri())
        .messages({
        'string.uri': 'Image must be a valid URL',
    }),
    active: joi_1.default.boolean(),
});
// Promotion validation schemas
exports.createPromotionSchema = joi_1.default.object({
    productId: joi_1.default.number().required()
        .messages({
        'number.base': 'Product ID must be a number',
        'any.required': 'Product ID is required',
    }),
    affiliateLink: joi_1.default.string().uri().required()
        .messages({
        'string.uri': 'Affiliate link must be a valid URL',
        'any.required': 'Affiliate link is required',
    }),
    description: joi_1.default.string().allow('').optional(),
    customImages: joi_1.default.array().items(joi_1.default.string().uri()).optional(),
    autoPostToSocial: joi_1.default.boolean().default(false)
});
exports.trackConversionSchema = joi_1.default.object({
    saleAmount: joi_1.default.number().min(0).required()
        .messages({
        'number.min': 'Sale amount cannot be negative',
        'any.required': 'Sale amount is required',
    }),
});
exports.addSocialMediaPostSchema = joi_1.default.object({
    platform: joi_1.default.string()
        .valid('facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'linkedin', 'pinterest', 'other')
        .required()
        .messages({
        'any.only': 'Platform must be one of the supported platforms',
        'any.required': 'Platform is required',
    }),
    postUrl: joi_1.default.string().uri().required()
        .messages({
        'string.uri': 'Post URL must be a valid URL',
        'any.required': 'Post URL is required',
    }),
    postId: joi_1.default.string().allow(''),
    postDate: joi_1.default.date().iso().default(Date.now)
        .messages({
        'date.base': 'Post date must be a valid date',
    }),
});
