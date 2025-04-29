import Joi from 'joi';

// User validation schemas
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required',
    }),
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string().min(6).required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'any.required': 'Password is required',
    }),
  role: Joi.string().valid('business', 'promoter').default('business')
    .messages({
      'any.only': 'Role must be either "business" or "promoter"',
    }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'any.required': 'Email is required',
    }),
  password: Joi.string().required()
    .messages({
      'any.required': 'Password is required',
    }),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50)
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 50 characters',
    }),
  email: Joi.string().email()
    .messages({
      'string.email': 'Email must be a valid email address',
    }),
  profilePicture: Joi.string().uri().allow(null, '')
    .messages({
      'string.uri': 'Profile picture must be a valid URL',
    }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required()
    .messages({
      'any.required': 'Current password is required',
    }),
  newPassword: Joi.string().min(6).required()
    .messages({
      'string.min': 'New password must be at least 6 characters long',
      'any.required': 'New password is required',
    }),
});

// Product validation schemas
export const createProductSchema = Joi.object({
  name: Joi.string().min(3).max(100).required()
    .messages({
      'string.min': 'Product name must be at least 3 characters long',
      'string.max': 'Product name cannot exceed 100 characters',
      'any.required': 'Product name is required',
    }),
  description: Joi.string().min(10).max(2000).required()
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 2000 characters',
      'any.required': 'Description is required',
    }),
  price: Joi.number().min(0).required()
    .messages({
      'number.min': 'Price cannot be negative',
      'any.required': 'Price is required',
    }),
  category: Joi.string().required()
    .messages({
      'any.required': 'Category is required',
    }),
  commissionRate: Joi.number().min(0).required()
    .messages({
      'number.min': 'Commission rate cannot be negative',
      'any.required': 'Commission rate is required',
    }),
  commissionType: Joi.string().valid('percentage', 'fixed').required()
    .messages({
      'any.only': 'Commission type must be either "percentage" or "fixed"',
      'any.required': 'Commission type is required',
    }),
  images: Joi.array().items(Joi.string().uri()).min(1)
    .messages({
      'array.min': 'At least one product image is required',
      'string.uri': 'Image must be a valid URL',
    }),
  active: Joi.boolean().default(true),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(100)
    .messages({
      'string.min': 'Product name must be at least 3 characters long',
      'string.max': 'Product name cannot exceed 100 characters',
    }),
  description: Joi.string().min(10).max(2000)
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 2000 characters',
    }),
  price: Joi.number().min(0)
    .messages({
      'number.min': 'Price cannot be negative',
    }),
  category: Joi.string(),
  commissionRate: Joi.number().min(0)
    .messages({
      'number.min': 'Commission rate cannot be negative',
    }),
  commissionType: Joi.string().valid('percentage', 'fixed')
    .messages({
      'any.only': 'Commission type must be either "percentage" or "fixed"',
    }),
  images: Joi.array().items(Joi.string().uri())
    .messages({
      'string.uri': 'Image must be a valid URL',
    }),
  active: Joi.boolean(),
});

// Promotion validation schemas
export const createPromotionSchema = Joi.object({
  productId: Joi.number().required()
    .messages({
      'number.base': 'Product ID must be a number',
      'any.required': 'Product ID is required',
    }),
  affiliateLink: Joi.string().uri().required()
    .messages({
      'string.uri': 'Affiliate link must be a valid URL',
      'any.required': 'Affiliate link is required',
    }),
  description: Joi.string().allow('').optional(),
  customImages: Joi.array().items(Joi.string().uri()).optional(),
  autoPostToSocial: Joi.boolean().default(false)
});

export const trackConversionSchema = Joi.object({
  saleAmount: Joi.number().min(0).required()
    .messages({
      'number.min': 'Sale amount cannot be negative',
      'any.required': 'Sale amount is required',
    }),
});

export const addSocialMediaPostSchema = Joi.object({
  platform: Joi.string()
    .valid('facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'linkedin', 'pinterest', 'other')
    .required()
    .messages({
      'any.only': 'Platform must be one of the supported platforms',
      'any.required': 'Platform is required',
    }),
  postUrl: Joi.string().uri().required()
    .messages({
      'string.uri': 'Post URL must be a valid URL',
      'any.required': 'Post URL is required',
    }),
  postId: Joi.string().allow(''),
  postDate: Joi.date().iso().default(Date.now)
    .messages({
      'date.base': 'Post date must be a valid date',
    }),
}); 