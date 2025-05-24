import { Request as ExpressRequest, Response } from 'express';
import Product from '../models/product.model';
import { User } from '../models';
import { Op } from 'sequelize';

// Define custom Request type with needed properties
interface Request extends ExpressRequest {
  user?: any;
  body: any;
  params: any;
  query: any;
}

// Create a new product
export const createProduct = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { 
      name, 
      description, 
      price, 
      category, 
      commissionRate, 
      commissionType,
      affiliateLink,
      sourcePlatform,
      images,
      active = true
    } = req.body;

    // Validate the commission type
    if (commissionType && !['percentage', 'fixed'].includes(commissionType)) {
      return res.status(400).json({
        message: 'Invalid commission type. Must be either "percentage" or "fixed"',
      });
    }

    // Create the product
    const product = await Product.create({
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
    const createdProduct = await Product.findByPk(product.id, {
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      }]
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: createdProduct,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error creating product',
      error: error.message,
    });
  }
};

// Get all products
export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { category, active, search, sort = 'createdAt', order = 'desc' } = req.query;
    
    // Build query
    const where: any = {};
    
    if (category) {
      where.category = category;
    }
    
    if (active !== undefined) {
      where.active = active === 'true';
    }
    
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }
    
    // Build sort
    const order_option: any = [[sort as string, order as string]];
    
    const products = await Product.findAll({
      where,
      order: order_option,
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      }]
    });
    
    res.status(200).json({
      count: products.length,
      products
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error fetching products',
      error: error.message
    });
  }
};

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
export const getProductById = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    
    const product = await Product.findByPk(productId, {
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
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
  } catch (error: any) {
    res.status(500).json({
      message: 'Error fetching product',
      error: error.message
    });
  }
};

// Get products by owner
export const getProductsByOwner = async (req: Request, res: Response) => {
  try {
    const ownerId = req.params.ownerId || (req.user as any).id;
    
    const products = await Product.findAll({
      where: { ownerId },
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      }]
    });
    
    res.status(200).json({
      count: products.length,
      products
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error fetching owner products',
      error: error.message
    });
  }
};

// Update product
export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any).id;
    const { 
      name, 
      description, 
      price, 
      category, 
      commissionRate, 
      commissionType, 
      active,
      affiliateLink,
      sourcePlatform,
      images
    } = req.body;

    // Find the product
    const product = await Product.findByPk(parseInt(id));

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
    const fullUpdatedProduct = await Product.findByPk(product.id, {
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      }]
    });

    res.status(200).json({
      message: 'Product updated successfully',
      product: fullUpdatedProduct,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error updating product',
      error: error.message,
    });
  }
};

// Delete product
export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const userId = (req.user as any).id;
    
    // Find product and check ownership
    const product = await Product.findByPk(productId);
    
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
  } catch (error: any) {
    res.status(500).json({
      message: 'Error deleting product',
      error: error.message
    });
  }
};

// Duplicate a product
export const duplicateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req.user as any).id;
    
    // Find the source product
    const sourceProduct = await Product.findByPk(parseInt(id));
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
    const newProduct = await Product.create({
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
    const createdProduct = await Product.findByPk(newProduct.id, {
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'firstName', 'lastName', 'email', 'profilePicture']
      }]
    });
    
    res.status(201).json({
      message: 'Product duplicated successfully',
      product: createdProduct,
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error duplicating product',
      error: error.message,
    });
  }
}; 