"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.duplicateProduct = exports.deleteProduct = exports.updateProduct = exports.getProductsByOwner = exports.getProductById = exports.getAllProducts = exports.createProduct = void 0;
const product_model_1 = __importDefault(require("../models/product.model"));
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
// Create a new product
const createProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, price, category, commissionRate, commissionType, affiliateLink, sourcePlatform, images, active = true } = req.body;
        // Validate the commission type
        if (commissionType && !['percentage', 'fixed'].includes(commissionType)) {
            return res.status(400).json({
                message: 'Invalid commission type. Must be either "percentage" or "fixed"',
            });
        }
        // Create the product
        const product = await product_model_1.default.create({
            name,
            description,
            price,
            ownerId: userId,
            category,
            commissionRate: commissionRate || 0,
            commissionType: commissionType || 'percentage',
            active,
            affiliateLink,
            sourcePlatform,
            images: images || []
        });
        // Fetch the created product with owner information
        const createdProduct = await product_model_1.default.findByPk(product.id, {
            include: [{
                    model: models_1.User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email', 'profilePicture']
                }]
        });
        res.status(201).json({
            message: 'Product created successfully',
            product: createdProduct,
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error creating product',
            error: error.message,
        });
    }
};
exports.createProduct = createProduct;
// Get all products
const getAllProducts = async (req, res) => {
    try {
        const { category, active, search, sort = 'createdAt', order = 'desc' } = req.query;
        // Build query
        const where = {};
        if (category) {
            where.category = category;
        }
        if (active !== undefined) {
            where.active = active === 'true';
        }
        if (search) {
            where[sequelize_1.Op.or] = [
                { name: { [sequelize_1.Op.iLike]: `%${search}%` } },
                { description: { [sequelize_1.Op.iLike]: `%${search}%` } }
            ];
        }
        // Build sort
        const order_option = [[sort, order]];
        const products = await product_model_1.default.findAll({
            where,
            order: order_option,
            include: [{
                    model: models_1.User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email', 'profilePicture']
                }]
        });
        res.status(200).json({
            count: products.length,
            products
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error fetching products',
            error: error.message
        });
    }
};
exports.getAllProducts = getAllProducts;
// // Get all products
// export const getAllProductsCount = async (req: Request, res: Response) => {
//   try {
//     // Build sort
//     const products = await Product.count();
//     res.status(200).json({
//       products
//     });
//   } catch (error: any) {
//     res.status(500).json({
//       message: 'Error counting products',
//       error: error.message
//     });
//   }
// };
// Get product by ID
const getProductById = async (req, res) => {
    try {
        const productId = req.params.id;
        const product = await product_model_1.default.findByPk(productId, {
            include: [{
                    model: models_1.User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email', 'profilePicture']
                }]
        });
        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }
        res.status(200).json({
            product
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error fetching product',
            error: error.message
        });
    }
};
exports.getProductById = getProductById;
// Get products by owner
const getProductsByOwner = async (req, res) => {
    try {
        const ownerId = req.params.ownerId || req.user.id;
        const products = await product_model_1.default.findAll({
            where: { ownerId },
            order: [['createdAt', 'DESC']],
            include: [{
                    model: models_1.User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email', 'profilePicture']
                }]
        });
        res.status(200).json({
            count: products.length,
            products
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error fetching owner products',
            error: error.message
        });
    }
};
exports.getProductsByOwner = getProductsByOwner;
// Update product
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { name, description, price, category, commissionRate, commissionType, active, affiliateLink, sourcePlatform, images } = req.body;
        // Find the product
        const product = await product_model_1.default.findByPk(parseInt(id));
        if (!product) {
            return res.status(404).json({
                message: 'Product not found',
            });
        }
        // Check if the user is the owner
        if (product.ownerId !== userId) {
            return res.status(403).json({
                message: 'Not authorized to update this product',
            });
        }
        // Update product fields
        const updatedProduct = await product.update({
            name: name !== undefined ? name : product.name,
            description: description !== undefined ? description : product.description,
            price: price !== undefined ? price : product.price,
            category: category !== undefined ? category : product.category,
            commissionRate: commissionRate !== undefined ? commissionRate : product.commissionRate,
            commissionType: commissionType !== undefined ? commissionType : product.commissionType,
            active: active !== undefined ? active : product.active,
            affiliateLink: affiliateLink !== undefined ? affiliateLink : product.affiliateLink,
            sourcePlatform: sourcePlatform !== undefined ? sourcePlatform : product.sourcePlatform,
            images: images !== undefined ? images : product.images
        });
        // Get the updated product with owner information
        const fullUpdatedProduct = await product_model_1.default.findByPk(product.id, {
            include: [{
                    model: models_1.User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email', 'profilePicture']
                }]
        });
        res.status(200).json({
            message: 'Product updated successfully',
            product: fullUpdatedProduct,
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error updating product',
            error: error.message,
        });
    }
};
exports.updateProduct = updateProduct;
// Delete product
const deleteProduct = async (req, res) => {
    try {
        const productId = req.params.id;
        const userId = req.user.id;
        // Find product and check ownership
        const product = await product_model_1.default.findByPk(productId);
        if (!product) {
            return res.status(404).json({
                message: 'Product not found'
            });
        }
        // Check if user is the owner
        if (product.ownerId !== userId) {
            return res.status(403).json({
                message: 'Not authorized to delete this product'
            });
        }
        // Delete product
        await product.destroy();
        res.status(200).json({
            message: 'Product deleted successfully'
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error deleting product',
            error: error.message
        });
    }
};
exports.deleteProduct = deleteProduct;
// Duplicate a product
const duplicateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        // Find the source product
        const sourceProduct = await product_model_1.default.findByPk(parseInt(id));
        if (!sourceProduct) {
            return res.status(404).json({
                message: 'Source product not found',
            });
        }
        // Check if user has permission to access this product
        if (sourceProduct.ownerId !== userId) {
            return res.status(403).json({
                message: 'Not authorized to duplicate this product',
            });
        }
        // Create a new product with the same details
        const newProduct = await product_model_1.default.create({
            name: `${sourceProduct.name} (Copy)`,
            description: sourceProduct.description,
            price: sourceProduct.price,
            ownerId: userId,
            category: sourceProduct.category,
            commissionRate: sourceProduct.commissionRate,
            commissionType: sourceProduct.commissionType,
            active: true, // Set the duplicate as active by default
            affiliateLink: sourceProduct.affiliateLink,
            sourcePlatform: sourceProduct.sourcePlatform,
            images: sourceProduct.images || []
        });
        // Fetch the created product with owner information
        const createdProduct = await product_model_1.default.findByPk(newProduct.id, {
            include: [{
                    model: models_1.User,
                    as: 'owner',
                    attributes: ['id', 'name', 'email', 'profilePicture']
                }]
        });
        res.status(201).json({
            message: 'Product duplicated successfully',
            product: createdProduct,
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error duplicating product',
            error: error.message,
        });
    }
};
exports.duplicateProduct = duplicateProduct;
