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
    const { productId, name, description, commissionRate, commissionType, customImages } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ message: `Product not found with ID: ${productId}` });
    }

    // Check if user already has a promotion for this product
    const existingPromotion = await Promotion.findOne({
      where: {
        productId,
        promoterId: userId
      }
    });

    if (existingPromotion) {
      return res.status(400).json({ message: 'You already have a promotion for this product' });
    }

    // Calculate initial earnings based on commission type and product price
    let initialEarnings = 50; // Set a fixed numeric value for testing
    const finalCommissionRate = commissionRate || product.commissionRate;
    const finalCommissionType = commissionType || product.commissionType;

    // Ensure price and commission rate are numbers
    // const productPrice = parseFloat(product.price.toString());
    // const commissionRateValue = parseFloat(finalCommissionRate.toString());
    
    // if (finalCommissionType === 'percentage' && !isNaN(productPrice) && !isNaN(commissionRateValue)) {
    //   initialEarnings = (productPrice * commissionRateValue) / 100;
    //   console.log('Calculated percentage earnings:', initialEarnings);
    // } else if (finalCommissionType === 'fixed' && !isNaN(commissionRateValue)) {
    //   initialEarnings = commissionRateValue;
    //   console.log('Fixed earnings:', initialEarnings);
    // } else {
    //   console.log('Could not calculate earnings, using default 0');
    // }
    
    // // Ensure earnings is a valid number
    // initialEarnings = isNaN(initialEarnings) ? 0 : initialEarnings;

    // Create the promotion
    const promotionData = {
      productId,
      promoterId: userId,
      name: name || `Promotion for ${product.name}`,
      description: description || product.description,
      commissionRate: finalCommissionRate,
      commissionType: finalCommissionType,
      customImages: customImages || product.images,
      status: 'active',
      clicks: 0,
      conversions: 0,
      earnings: initialEarnings
    };

    console.log('Creating promotion with data:', JSON.stringify(promotionData));
    const promotion = await Promotion.create(promotionData as any);
    console.log('Created promotion:', JSON.stringify(promotion));

    return res.status(201).json({
      message: 'Promotion created successfully',
      promotion
    });
  } catch (error) {
    console.error('Error creating promotion:', error);
    return res.status(500).json({ message: 'Failed to create promotion' });
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