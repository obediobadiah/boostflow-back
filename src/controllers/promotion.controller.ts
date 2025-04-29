import { Request as ExpressRequest, Response } from 'express';
import { Promotion, Product, User, SocialMediaPost, SocialMediaAccount } from '../models';
import * as crypto from 'crypto';


interface Request extends ExpressRequest {
  user?: any;
  body: any;
  params: any;
  query: any;
}

// Implementation of generateTrackingCode to avoid import issues
const generateTrackingCode = async (): Promise<string> => {
  // Generate a random string
  const randomBytes = crypto.randomBytes(8).toString('hex');
  
  // Create a tracking code with a prefix
  const trackingCode = `BF-${randomBytes}`;
  
  // Check if it already exists
  const existingPromotion = await Promotion.findOne({ 
    where: { trackingCode } 
  });
  
  // If exists, generate a new one recursively
  if (existingPromotion) {
    return generateTrackingCode();
  }
  
  return trackingCode;
};

// Create a new promotion
export const createPromotion = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const { 
      productId, 
      affiliateLink, 
      description, 
      customImages,
      autoPostToSocial 
    } = req.body;
    
    console.log('Creating promotion with data:', {
      userId,
      productId,
      affiliateLink,
      description,
      customImages,
      autoPostToSocial
    });
    
    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      console.log('Product not found:', productId);
      return res.status(404).json({
        message: 'Product not found'
      });
    }
    
    // Check if promotion already exists for this product and promoter
    const existingPromotion = await Promotion.findOne({
      where: {
        productId,
        promoterId: userId
      }
    });
    
    if (existingPromotion) {
      console.log('Promotion already exists:', { productId, userId });
      return res.status(400).json({
        message: 'You are already promoting this product',
        promotion: existingPromotion
      });
    }
    
    // Create new promotion
    const trackingCode = await generateTrackingCode();
    
    const promotionData = {
      productId,
      promoterId: userId,
      trackingCode,
      commissionRate: product.commissionRate,
      commissionType: product.commissionType,
      affiliateLink: affiliateLink || product.affiliateLink,
      description: description || product.description,
      customImages: customImages || product.images,
      autoPostToSocial: autoPostToSocial || false,
      status: 'active' as const,
      clicks: 0,
      conversions: 0,
      earnings: 0
    };

    console.log('Creating promotion with data:', promotionData);
    
    const promotion = await Promotion.create(promotionData);

    // If autoPostToSocial is true, post to connected social media accounts
    if (autoPostToSocial) {
      await postToSocialMedia(userId, promotion);
    }
    
    console.log('Promotion created successfully:', promotion.id);
    
    res.status(201).json({
      message: 'Promotion created successfully',
      promotion
    });
  } catch (error: any) {
    console.error('Error creating promotion:', {
      error: error.message,
      stack: error.stack,
      data: req.body
    });
    
    res.status(500).json({
      message: 'Error creating promotion',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get promotions by promoter
export const getPromotionsByPromoter = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    
    const promotions = await Promotion.findAll({ 
      where: { promoterId: userId },
      include: [Product],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      count: promotions.length,
      promotions
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error fetching promotions',
      error: error.message
    });
  }
};

// Get promotions by product
export const getPromotionsByProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = (req.user as any).id;
    
    // Check if product exists and user is the owner
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }
    
    if (product.ownerId !== userId) {
      return res.status(403).json({
        message: 'Not authorized to view this product\'s promotions'
      });
    }
    
    const promotions = await Promotion.findAll({ 
      where: { productId },
      include: [{
        model: User,
        as: 'promoter',
        attributes: ['id', 'name', 'email', 'profilePicture']
      }],
      order: [['clicks', 'DESC']]
    });
    
    res.status(200).json({
      count: promotions.length,
      promotions
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error fetching product promotions',
      error: error.message
    });
  }
};

// Track click
export const trackClick = async (req: Request, res: Response) => {
  try {
    const { trackingCode } = req.params;
    
    const promotion = await Promotion.findOne({ 
      where: { trackingCode }
    });
    
    if (!promotion) {
      return res.status(404).json({
        message: 'Promotion not found'
      });
    }
    
    // Increment clicks
    await promotion.update({
      clicks: promotion.clicks + 1
    });
    
    res.status(200).json({
      message: 'Click tracked successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error tracking click',
      error: error.message
    });
  }
};

// Track conversion
export const trackConversion = async (req: Request, res: Response) => {
  try {
    const { trackingCode } = req.params;
    const { saleAmount } = req.body;
    
    const promotion = await Promotion.findOne({ 
      where: { trackingCode }
    });
    
    if (!promotion) {
      return res.status(404).json({
        message: 'Promotion not found'
      });
    }
    
    // Calculate new earnings based on commission type
    let newEarnings = promotion.earnings;
    
    if (promotion.commissionType === 'percentage' && saleAmount) {
      newEarnings += (saleAmount * promotion.commissionRate) / 100;
    } else if (promotion.commissionType === 'fixed') {
      newEarnings += promotion.commissionRate;
    }
    
    // Update promotion
    await promotion.update({
      conversions: promotion.conversions + 1,
      earnings: newEarnings
    });
    
    const updatedPromotion = await Promotion.findByPk(promotion.id);
    
    res.status(200).json({
      message: 'Conversion tracked successfully',
      promotion: updatedPromotion
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error tracking conversion',
      error: error.message
    });
  }
};

// Post to social media accounts
const postToSocialMedia = async (userId: number, promotion: any) => {
  try {
    // Get all social media accounts for the user
    const socialMediaAccounts = await SocialMediaAccount.findAll({
      where: {
        userId,
        isConnected: true
      }
    });

    if (socialMediaAccounts.length === 0) {
      return;
    }

    // Get product details
    const product = await Product.findByPk(promotion.productId);
    if (!product) {
      return;
    }

    // For each social media account, create a post
    for (const account of socialMediaAccounts) {
      // Create content based on platform
      let content = '';
      let images = promotion.customImages && promotion.customImages.length > 0 
        ? promotion.customImages 
        : product.images;
      
      const description = promotion.description || product.description;
      const truncatedDesc = description.length > 100 
        ? `${description.substring(0, 97)}...` 
        : description;

      // Generate different content based on platform
      switch (account.platform) {
        case 'twitter':
          content = `Check out this amazing product: ${truncatedDesc} Use my link: ${promotion.affiliateLink}`;
          break;
        case 'facebook':
        case 'instagram':
          content = `🔥 PRODUCT ALERT! 🔥\n\n${description}\n\nGet it now using my special link: ${promotion.affiliateLink}`;
          break;
        case 'linkedin':
          content = `I'm excited to share this great product with my network!\n\n${description}\n\nCheck it out: ${promotion.affiliateLink}`;
          break;
        default:
          content = `Check out this product: ${description}\n\nUse my link: ${promotion.affiliateLink}`;
      }

      // Create the social media post
      await SocialMediaPost.create({
        promotionId: promotion.id,
        platform: account.platform,
        postUrl: '', // Will be updated after actual posting
        postId: '', // Will be updated after actual posting
        postDate: new Date(),
        content,
        images,
        clicks: 0,
        conversions: 0
      } as any);  // Use type assertion to handle type mismatch temporarily

      // Here you would integrate with the actual social media APIs
      // This is where integration with specific social platform APIs would go
      // For now, we're just creating the records in our database
    }
  } catch (error) {
    console.error('Error posting to social media:', error);
  }
};

// Add social media post to promotion
export const addSocialMediaPost = async (req: Request, res: Response) => {
  try {
    const { promotionId } = req.params;
    const userId = (req.user as any).id;
    const { platform, postUrl, postId, postDate, content, images } = req.body;
    
    // Check if promotion exists and user is the promoter
    const promotion = await Promotion.findByPk(parseInt(promotionId));
    
    if (!promotion) {
      return res.status(404).json({
        message: 'Promotion not found'
      });
    }
    
    if (promotion.promoterId !== userId) {
      return res.status(403).json({
        message: 'Not authorized to add a post to this promotion'
      });
    }
    
    // Create a new social media post
    await SocialMediaPost.create({
      promotionId: parseInt(promotionId),
      platform,
      postUrl,
      postId: postId || '',
      postDate: postDate || new Date(),
      content,
      images,
      clicks: 0,
      conversions: 0
    } as any); // Type assertion to bypass the strict type checking
    
    const updatedPromotion = await Promotion.findByPk(parseInt(promotionId), {
      include: [{
        model: SocialMediaPost,
        as: 'socialMediaPosts'
      }]
    });
    
    res.status(200).json({
      message: 'Social media post added successfully',
      promotion: updatedPromotion
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error adding social media post',
      error: error.message
    });
  }
}; 