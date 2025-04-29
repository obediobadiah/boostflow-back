"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const models_1 = require("../models");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Middleware to check if user is authenticated
const authenticate = passport_1.default.authenticate('jwt', { session: false });
// Middleware to check if user has permission to create products
const canCreateProducts = (req, res, next) => {
    const user = req.user;
    if (!user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    if (user.role !== 'business' && user.role !== 'admin') {
        res.status(403).json({ message: 'Only business and admin users can create products' });
        return;
    }
    next();
};
// Validation middleware for products
const validateProduct = [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Product name is required'),
    (0, express_validator_1.body)('description').notEmpty().withMessage('Description is required'),
    (0, express_validator_1.body)('price').isNumeric().withMessage('Price must be a number'),
    (0, express_validator_1.body)('category').notEmpty().withMessage('Category is required'),
    (0, express_validator_1.body)('commissionRate').isNumeric().withMessage('Commission rate must be a number'),
    (0, express_validator_1.body)('commissionType').isIn(['percentage', 'fixed']).withMessage('Commission type must be percentage or fixed'),
    (0, express_validator_1.body)('images').optional(),
];
// Validation middleware for product updates (less strict)
const validateProductUpdate = [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Product name cannot be empty'),
    (0, express_validator_1.body)('description').optional().notEmpty().withMessage('Description cannot be empty'),
    (0, express_validator_1.body)('price').optional().isNumeric().withMessage('Price must be a number'),
    (0, express_validator_1.body)('category').optional().notEmpty().withMessage('Category cannot be empty'),
    (0, express_validator_1.body)('commissionRate').optional().isNumeric().withMessage('Commission rate must be a number'),
    (0, express_validator_1.body)('commissionType').optional().isIn(['percentage', 'fixed']).withMessage('Commission type must be percentage or fixed'),
    (0, express_validator_1.body)('active').optional().isBoolean().withMessage('Active must be a boolean'),
    (0, express_validator_1.body)('images').optional(),
];
// Get all products
router.get('/', async (_req, res, next) => {
    try {
        const products = await models_1.Product.findAll({
            include: [
                {
                    model: models_1.User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email', 'profilePicture']
                }
            ]
        });
        res.json({
            count: products.length,
            products: products
        });
    }
    catch (error) {
        next(error);
    }
});
// Get product by ID
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await models_1.Product.findByPk(id, {
            include: [
                {
                    model: models_1.User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email', 'profilePicture']
                }
            ]
        });
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    }
    catch (error) {
        next(error);
    }
});
// Create a new product
router.post('/', authenticate, canCreateProducts, validateProduct, async (req, res, next) => {
    try {
        console.log('Product creation request received:', {
            body: req.body ? Object.keys(req.body) : 'No body',
            auth: req.user ? 'Authenticated' : 'Not Authenticated',
            userId: req.user ? req.user.id : 'No ID',
            contentType: req.headers && req.headers['content-type']
        });
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }
        if (!req.user) {
            console.log('Auth failed - no user in request');
            return res.status(401).json({ message: 'Authentication required' });
        }
        const user = req.user;
        const { name, description, price, category, commissionRate, commissionType = 'percentage', images = [], affiliateLink, sourcePlatform } = req.body;
        try {
            // Ensure price and commissionRate are valid numbers
            let parsedPrice;
            let parsedCommissionRate;
            try {
                parsedPrice = typeof price === 'number' ? price : parseFloat(price);
                if (isNaN(parsedPrice)) {
                    return res.status(400).json({ message: 'Price must be a valid number' });
                }
                // Format to respect DECIMAL(10, 2) in the database
                // This restricts to 10 total digits, with 2 decimal places
                if (parsedPrice.toString().replace('.', '').length > 10) {
                    return res.status(400).json({
                        message: 'Price is too large',
                        error: 'Price exceeds the maximum allowed digits (10 digits total, with 2 decimal places)'
                    });
                }
                // Properly format for database by limiting to 2 decimal places
                parsedPrice = parseFloat(parsedPrice.toFixed(2));
            }
            catch (error) {
                return res.status(400).json({ message: 'Price is in invalid format' });
            }
            try {
                parsedCommissionRate = typeof commissionRate === 'number' ? commissionRate : parseFloat(commissionRate);
                if (isNaN(parsedCommissionRate)) {
                    return res.status(400).json({ message: 'Commission rate must be a valid number' });
                }
                // Format to respect DECIMAL(10, 2) in the database
                // This restricts to 10 total digits, with 2 decimal places
                if (parsedCommissionRate.toString().replace('.', '').length > 10) {
                    return res.status(400).json({
                        message: 'Commission rate is too large',
                        error: 'Commission rate exceeds the maximum allowed digits (10 digits total, with 2 decimal places)'
                    });
                }
                // Properly format for database by limiting to 2 decimal places
                parsedCommissionRate = parseFloat(parsedCommissionRate.toFixed(2));
            }
            catch (error) {
                return res.status(400).json({ message: 'Commission rate is in invalid format' });
            }
            // Process images - ensure it's an array and validate
            let processedImages = [];
            // If images is a string (by mistake), try to parse it
            if (typeof images === 'string') {
                try {
                    const parsed = JSON.parse(images);
                    processedImages = Array.isArray(parsed) ? parsed : [images];
                }
                catch {
                    // If parsing fails, treat as a single image URL
                    processedImages = [images];
                }
            }
            // If images is already an array, use it
            else if (Array.isArray(images)) {
                processedImages = images;
            }
            console.log('Creating product with data:', {
                name,
                description: description ? `${description.substring(0, 30)}...` : 'missing',
                price: parsedPrice,
                ownerId: user.id,
                category,
                commissionRate: parsedCommissionRate,
                commissionType,
                imagesCount: processedImages.length
            });
            // Create the product with validated data
            try {
                const product = await models_1.Product.create({
                    name,
                    description,
                    price: parsedPrice,
                    images: processedImages,
                    ownerId: user.id,
                    category,
                    commissionRate: parsedCommissionRate,
                    commissionType,
                    affiliateLink,
                    sourcePlatform,
                    active: true,
                });
                console.log('Product created successfully:', {
                    id: product.id,
                    name: product.name
                });
                return res.status(201).json({
                    message: 'Product created successfully',
                    product
                });
            }
            catch (dbError) {
                console.error('Database error creating product:', dbError);
                // Add explicit log of the data being sent to database
                console.error('Failed product data:', {
                    name,
                    price: parsedPrice,
                    type: typeof parsedPrice,
                    commissionRate: parsedCommissionRate,
                    type2: typeof parsedCommissionRate,
                    imagesType: typeof processedImages,
                    isImagesArray: Array.isArray(processedImages),
                    commissionType
                });
                // Check for specific database errors
                if (dbError.name === 'SequelizeValidationError') {
                    console.log('Validation errors:', dbError.errors);
                    // Map the errors to more user-friendly messages
                    const errors = dbError.errors.map((e) => {
                        let message = e.message;
                        // Handle specific validation types
                        if (e.validatorKey === 'len') {
                            // Length validation
                            if (e.path === 'name') {
                                const [min, max] = e.validatorArgs;
                                message = `Product name must be between ${min} and ${max} characters`;
                            }
                        }
                        else if (e.validatorKey === 'min') {
                            // Minimum value validation
                            if (e.path === 'price' || e.path === 'commissionRate') {
                                message = `${e.path.charAt(0).toUpperCase() + e.path.slice(1)} must be greater than or equal to ${e.validatorArgs[0]}`;
                            }
                        }
                        else if (e.validatorKey === 'notEmpty') {
                            // Not empty validation
                            message = `${e.path.charAt(0).toUpperCase() + e.path.slice(1)} cannot be empty`;
                        }
                        else if (e.validatorKey === 'isIn') {
                            // Enum validation
                            if (e.path === 'commissionType') {
                                message = `Commission type must be one of: ${e.validatorArgs[0].join(', ')}`;
                            }
                        }
                        else if (e.validatorKey === 'not_null') {
                            // Not null validation
                            message = `${e.path.charAt(0).toUpperCase() + e.path.slice(1)} is required`;
                        }
                        else if (e.validatorKey === 'isEmail') {
                            // Email validation
                            message = `Please enter a valid email address`;
                        }
                        else if (e.validatorKey === 'isUrl') {
                            // URL validation
                            message = `Please enter a valid URL`;
                        }
                        else if (e.validatorKey === 'isNumeric') {
                            // Numeric validation
                            message = `${e.path.charAt(0).toUpperCase() + e.path.slice(1)} must be a number`;
                        }
                        else if (e.validatorKey === 'isDecimal') {
                            // Decimal validation
                            message = `${e.path.charAt(0).toUpperCase() + e.path.slice(1)} must be a decimal number`;
                        }
                        else if (e.validatorKey === 'max') {
                            // Maximum value validation
                            message = `${e.path.charAt(0).toUpperCase() + e.path.slice(1)} must be less than or equal to ${e.validatorArgs[0]}`;
                        }
                        return {
                            field: e.path,
                            message: message,
                            type: e.validatorKey
                        };
                    });
                    return res.status(400).json({
                        message: 'Validation error',
                        errors: errors
                    });
                }
                else if (dbError.name === 'SequelizeDatabaseError') {
                    // Database-level errors
                    console.error('Database error details:', {
                        message: dbError.message,
                        sql: dbError.sql,
                        parameters: dbError.parameters,
                        parent: dbError.parent,
                        original: dbError.original
                    });
                    // Check for specific database error types
                    if (dbError.message.includes('invalid input syntax') || dbError.message.includes('numeric field overflow')) {
                        // Numeric format errors
                        return res.status(400).json({
                            message: 'Invalid numeric format',
                            error: 'One or more fields have invalid numeric values. Please check price and commission rate for valid numbers.'
                        });
                    }
                    else if (dbError.message.includes('value too long') || dbError.message.includes('out of range')) {
                        // Length or range errors
                        return res.status(400).json({
                            message: 'Data size error',
                            error: 'One or more fields exceed the maximum allowed size or range.'
                        });
                    }
                    else if (dbError.message.includes('array')) {
                        // Array errors
                        return res.status(400).json({
                            message: 'Array format error',
                            error: 'There was an issue with the image array format. Please try with fewer images or smaller image sizes.'
                        });
                    }
                    else {
                        // Other database errors
                        return res.status(400).json({
                            message: 'Database error',
                            error: dbError.message
                        });
                    }
                }
                else if (dbError.name === 'SequelizeUniqueConstraintError') {
                    // Unique constraint violations
                    return res.status(400).json({
                        message: 'A product with these details already exists',
                        errors: dbError.errors.map((e) => ({
                            field: e.path,
                            message: `A product with this ${e.path} already exists`
                        }))
                    });
                }
                else if (dbError.name === 'SequelizeForeignKeyConstraintError') {
                    // Foreign key constraint violations (e.g., invalid ownerId)
                    return res.status(400).json({
                        message: 'Invalid reference data',
                        error: 'One or more references in your product data are invalid'
                    });
                }
                return res.status(500).json({
                    message: 'Error creating product in database',
                    error: dbError.message
                });
            }
        }
        catch (error) {
            console.error('Unexpected error in product creation:', error);
            return res.status(500).json({
                message: 'Server error processing product creation',
                error: error.message
            });
        }
    }
    catch (error) {
        console.error('Unexpected error in product creation:', error);
        return res.status(500).json({
            message: 'Server error processing product creation',
            error: error.message
        });
    }
});
// Update a product
router.put('/:id', authenticate, validateProductUpdate, async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        const user = req.user;
        // Check if product exists
        const product = await models_1.Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // Check if user is the owner
        if (product.getDataValue('ownerId') !== user.id && user.role !== 'admin') {
            return res.status(403).json({ message: 'You do not have permission to update this product' });
        }
        const { name, description, price, category, commissionRate, commissionType, images, active } = req.body;
        // Update product
        await product.update({
            name,
            description,
            price,
            images,
            category,
            commissionRate,
            commissionType,
            active,
        });
        res.json({
            message: 'Product updated successfully',
            product
        });
    }
    catch (error) {
        next(error);
    }
});
// Delete a product
router.delete('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;
        // Check if product exists
        const product = await models_1.Product.findByPk(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        // Check if user is the owner or admin
        if (product.getDataValue('ownerId') !== user.id && user.role !== 'admin') {
            return res.status(403).json({ message: 'You do not have permission to delete this product' });
        }
        // Delete product
        await product.destroy();
        res.json({ message: 'Product deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Get products by owner
router.get('/owner/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const products = await models_1.Product.findAll({
            where: { ownerId: id },
            include: [
                {
                    model: models_1.User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email', 'profilePicture']
                }
            ]
        });
        res.json(products);
    }
    catch (error) {
        next(error);
    }
});
// Duplicate a product
router.post('/:id/duplicate', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;
        if (!user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        // Find the source product
        const sourceProduct = await models_1.Product.findByPk(parseInt(id));
        if (!sourceProduct) {
            return res.status(404).json({
                message: 'Source product not found',
            });
        }
        // Check if user has permission to access this product
        if (sourceProduct.getDataValue('ownerId') !== user.id && user.role !== 'admin') {
            return res.status(403).json({
                message: 'Not authorized to duplicate this product',
            });
        }
        // Create a new product with the same details
        const newProduct = await models_1.Product.create({
            name: `${sourceProduct.getDataValue('name')} (Copy)`,
            description: sourceProduct.getDataValue('description'),
            price: sourceProduct.getDataValue('price'),
            ownerId: user.id,
            category: sourceProduct.getDataValue('category'),
            commissionRate: sourceProduct.getDataValue('commissionRate'),
            commissionType: sourceProduct.getDataValue('commissionType'),
            active: true, // Set the duplicate as active by default
            affiliateLink: sourceProduct.getDataValue('affiliateLink'),
            sourcePlatform: sourceProduct.getDataValue('sourcePlatform'),
            images: sourceProduct.getDataValue('images') || []
        });
        // Fetch the created product with owner information
        const createdProduct = await models_1.Product.findByPk(newProduct.id, {
            include: [{
                    model: models_1.User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email', 'profilePicture']
                }]
        });
        return res.status(201).json({
            message: 'Product duplicated successfully',
            product: createdProduct,
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
