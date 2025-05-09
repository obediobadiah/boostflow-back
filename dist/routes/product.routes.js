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
router.post('/', authenticate, [
    (0, express_validator_1.body)('name').notEmpty().withMessage('Product name is required'),
    (0, express_validator_1.body)('price').isNumeric().withMessage('Price must be a number'),
    (0, express_validator_1.body)('category').notEmpty().withMessage('Category is required'),
    (0, express_validator_1.body)('commissionRate').isNumeric().withMessage('Commission rate must be a number'),
    (0, express_validator_1.body)('commissionType').isIn(['percentage', 'fixed']).withMessage('Commission type must be either percentage or fixed')
], async (req, res) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        if (!req.user?.id) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        const { name, description, price, category, commissionRate, commissionType, affiliateLink, images, active = true } = req.body;
        // Create the product
        const product = await models_1.Product.create({
            name,
            description,
            price,
            category,
            commissionRate,
            commissionType,
            affiliateLink,
            images: images || [],
            active,
            ownerId: req.user.id
        });
        // Return the created product
        return res.status(201).json({
            message: 'Product created successfully',
            product
        });
    }
    catch (error) {
        console.error('Error creating product:', error);
        if (error instanceof ValidationError) {
            return res.status(400).json({
                message: 'Validation error',
                errors: error.errors
            });
        }
        return res.status(500).json({ message: 'Failed to create product' });
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
