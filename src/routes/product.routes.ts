import express, { Request as ExpressRequest, Response, NextFunction } from 'express';
import passport from 'passport';
import { Product, User } from '../models';
import { body, param, validationResult } from 'express-validator';
import { duplicateProduct } from '../controllers/product.controller';

const router = express.Router();

interface Request extends ExpressRequest {
  user?: any;
  body: any;
  params: any;
  headers: any;
}


// Middleware to check if user is authenticated
const authenticate = passport.authenticate('jwt', { session: false });

// Middleware to check if user has permission to create products
const canCreateProducts = (req: Request, res: Response, next: NextFunction): void => {
  const user = req.user as any;
  
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
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('commissionRate').isNumeric().withMessage('Commission rate must be a number'),
  body('commissionType').isIn(['percentage', 'fixed']).withMessage('Commission type must be percentage or fixed'),
  body('images').optional(),
];

// Validation middleware for product updates (less strict)
const validateProductUpdate = [
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('price').optional().isNumeric().withMessage('Price must be a number'),
  body('category').optional().notEmpty().withMessage('Category cannot be empty'),
  body('commissionRate').optional().isNumeric().withMessage('Commission rate must be a number'),
  body('commissionType').optional().isIn(['percentage', 'fixed']).withMessage('Commission type must be percentage or fixed'),
  body('active').optional().isBoolean().withMessage('Active must be a boolean'),
  body('images').optional(),
];

// Get all products
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ]
    });
    res.json({
      count: products.length,
      products: products
    });
  } catch (error) {
    next(error);
  }
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const product = await Product.findByPk(id, {
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ]
    });
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    next(error);
  }
});

// Create a new product
router.post('/', authenticate, [
  body('name').notEmpty().withMessage('Product name is required'),
  body('price').isNumeric().withMessage('Price must be a number'),
  body('category').notEmpty().withMessage('Category is required'),
  body('commissionRate').isNumeric().withMessage('Commission rate must be a number'),
  body('commissionType').isIn(['percentage', 'fixed']).withMessage('Commission type must be either percentage or fixed')
], async (req: Request, res: Response) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user?.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const {
      name,
      description,
      price,
      category,
      commissionRate,
      commissionType,
      affiliateLink,
      images,
      active = true
    } = req.body;

    // Create the product
    const product = await Product.create({
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
  } catch (error) {
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
router.put('/:id', authenticate, validateProductUpdate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const user = req.user as any;
    
    // Check if product exists
    const product = await Product.findByPk(id);
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
  } catch (error) {
    next(error);
  }
});

// Delete a product
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    
    // Check if product exists
    const product = await Product.findByPk(id);
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
  } catch (error) {
    next(error);
  }
});

// Get products by owner
router.get('/owner/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    
    const products = await Product.findAll({
      where: { ownerId: id },
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'profilePicture']
        }
      ]
    });
    
    res.json(products);
  } catch (error) {
    next(error);
  }
});

// Duplicate a product
router.post('/:id/duplicate', authenticate, async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const { id } = req.params;
    const user = req.user as any;
    
    if (!user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Find the source product
    const sourceProduct = await Product.findByPk(parseInt(id));
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
    const newProduct = await Product.create({
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
    const createdProduct = await Product.findByPk(newProduct.id, {
      include: [{
        model: User,
        as: 'owner',
        attributes: ['id', 'name', 'email', 'profilePicture']
      }]
    });
    
    return res.status(201).json({
      message: 'Product duplicated successfully',
      product: createdProduct,
    });
  } catch (error: any) {
    next(error);
  }
});

export default router; 