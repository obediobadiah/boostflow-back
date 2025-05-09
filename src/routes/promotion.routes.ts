import express, { Request, Response, RequestHandler } from 'express';
import { Promotion, Product, User } from '../models';
import passport from 'passport';
import { Op } from 'sequelize';

const router = express.Router();

interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    role?: string;
  };
  body: {
    productId?: number | string;
    trackingCode?: string;
    commissionRate?: number;
    commissionType?: 'percentage' | 'fixed';
    description?: string;
    customImages?: string[];
    autoPostToSocial?: boolean;
    status?: 'active' | 'inactive' | 'banned';
    affiliateLink?: string;
    platforms?: string[];
  };
  params: {
    id?: string;
  };
}

// Middleware
const authenticate = passport.authenticate('jwt', { session: false });

// Routes
router.get('/', authenticate, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Check if user is admin
    const isAdmin = req.user.role === 'admin';

    // For admin users, get all promotions
    if (isAdmin) {
      const promotions = await Promotion.findAll({
        include: [
          { 
            model: Product,
            as: 'product',
            include: [
              {
                model: User,
                as: 'owner',
                attributes: ['id', 'name', 'email']
              }
            ]
          },
          {
            model: User,
            as: 'promoter',
            attributes: ['id', 'name', 'email', 'role']
          }
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.json({
        count: promotions.length,
        promotions,
        isAdmin: true
      });
    } 
    
    // For regular users, only get their own promotions
    const promotions = await Promotion.findAll({
      where: { promoterId: req.user.id },
      include: [
        { 
          model: Product,
          as: 'product',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }
          ]
        },
        {
          model: User,
          as: 'promoter',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      count: promotions.length,
      promotions,
      isAdmin: false
    });
  } catch (error) {
    console.error('Error fetching promotions:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: 'Failed to fetch promotions',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
}) as unknown as RequestHandler);

router.post('/', authenticate, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { 
      productId, 
      trackingCode, 
      commissionRate,
      commissionType,
      description, 
      customImages, 
      autoPostToSocial,
      affiliateLink,
    } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Missing required field: productId' });
    }

    // Convert productId to number if it's a string
    const productIdNum = typeof productId === 'string' ? parseInt(productId, 10) : productId;

    // Fetch the product to get its details
    const product = await Product.findByPk(productIdNum);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Generate a tracking code if not provided
    const generatedTrackingCode = trackingCode || `PROMO-${Date.now().toString(36)}`;

    // Use provided affiliate link or generate one
    const finalAffiliateLink = affiliateLink || product.affiliateLink || `https://yourdomain.com/ref/${generatedTrackingCode}`;

    // Use product's commission rate/type if not provided
    const finalCommissionRate = commissionRate || product.commissionRate;
    const finalCommissionType = commissionType || product.commissionType;

    const existingPromotion = await Promotion.findOne({
      where: { 
        productId: productIdNum, 
        promoterId: req.user.id 
      }
    });

    if (existingPromotion) {
      return res.status(400).json({ message: 'You are already promoting this product' });
    }

    const promotion = await Promotion.create({
      productId: productIdNum,
      promoterId: req.user.id,
      trackingCode: generatedTrackingCode,
      commissionRate: finalCommissionRate,
      commissionType: finalCommissionType,
      description: description || product.description,
      customImages: customImages || product.images,
      autoPostToSocial: autoPostToSocial ?? false,
      status: 'active' as const,
      clicks: 0,
      conversions: 0,
      earnings: 0,
      affiliateLink: finalAffiliateLink
    });

    return res.status(201).json({
      id: promotion.id,
      trackingCode: promotion.trackingCode,
      affiliateLink: promotion.affiliateLink,
      message: 'Promotion created successfully'
    });
  } catch (error) {
    console.error('Error creating promotion:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({ 
      error: 'Failed to create promotion',
      details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
}) as unknown as RequestHandler);

router.get('/:id', authenticate, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.params.id) {
      return res.status(400).json({ error: 'Promotion ID is required' });
    }

    const promotion = await Promotion.findOne({
      where: {
        id: parseInt(req.params.id),
        promoterId: req.user.id
      },
      include: [
        { 
          model: Product,
          as: 'product',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    res.json(promotion);
  } catch (error) {
    console.error('Error fetching promotion:', error);
    res.status(500).json({ error: 'Failed to fetch promotion' });
  }
}) as unknown as RequestHandler);

router.put('/:id', authenticate, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.params.id) {
      return res.status(400).json({ error: 'Promotion ID is required' });
    }

    const { description, customImages, autoPostToSocial, status, affiliateLink } = req.body;

    const promotion = await Promotion.findOne({
      where: {
        id: parseInt(req.params.id),
        promoterId: req.user.id
      }
    });

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    await promotion.update({
      description,
      customImages,
      autoPostToSocial,
      status,
      affiliateLink
    });

    const updatedPromotion = await Promotion.findByPk(promotion.id, {
      include: [
        { 
          model: Product,
          as: 'product',
          include: [
            {
              model: User,
              as: 'owner',
              attributes: ['id', 'name', 'email']
            }
          ]
        }
      ]
    });

    res.json(updatedPromotion);
  } catch (error) {
    console.error('Error updating promotion:', error);
    res.status(500).json({ error: 'Failed to update promotion' });
  }
}) as unknown as RequestHandler);

router.delete('/:id', authenticate, (async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    if (!req.params.id) {
      return res.status(400).json({ error: 'Promotion ID is required' });
    }

    const promotion = await Promotion.findOne({
      where: {
        id: parseInt(req.params.id),
        promoterId: req.user.id
      }
    });

    if (!promotion) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    await promotion.destroy();

    res.json({ message: 'Promotion deleted successfully' });
  } catch (error) {
    console.error('Error deleting promotion:', error);
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
}) as unknown as RequestHandler);

export default router; 