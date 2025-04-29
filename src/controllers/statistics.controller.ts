import { Request, Response } from 'express';
import sequelize from '../config/database';
import Product from '../models/product.model';
import Promotion from '../models/promotion.model';
import SocialMediaAccount from '../models/socialMediaAccount.model';
import { UserInstance } from '../models/user.model';

// Define interface for aggregate statistics
interface PromotionAggregateStats {
  totalClicks: string | number | null;
  totalConversions: string | number | null;
  totalEarnings: string | number | null;
}

// Get dashboard statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserInstance)?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get total promotions
    const totalPromotions = await Promotion.count({
      where: { promoterId: userId }
    });

    // Get total clicks and conversions
    const promotionStats = await Promotion.findOne({
      attributes: [
        [sequelize.fn('SUM', sequelize.col('clicks')), 'totalClicks'],
        [sequelize.fn('SUM', sequelize.col('conversions')), 'totalConversions'],
        [sequelize.fn('SUM', sequelize.col('earnings')), 'totalEarnings']
      ],
      where: { promoterId: userId },
      raw: true
    }) as unknown as PromotionAggregateStats;

    // Calculate changes from previous period (mock data for now)
    const change = {
      promotions: '+5',
      clicks: '+12%',
      earnings: '+28%',
      conversions: '+4'
    };

    res.json({
      totalPromotions: totalPromotions || 0,
      clicksGenerated: parseInt(String(promotionStats?.totalClicks || '0')),
      earnings: parseFloat(String(promotionStats?.totalEarnings || '0')),
      conversions: parseInt(String(promotionStats?.totalConversions || '0')),
      change
    });
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    res.status(500).json({ message: 'Failed to get dashboard statistics' });
  }
};

// Get active promotions
export const getActivePromotions = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserInstance)?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const promotions = await Promotion.findAll({
      attributes: ['id', 'clicks', 'conversions', 'commissionRate', 'commissionType'],
      where: { 
        promoterId: userId,
        status: 'active'
      },
      include: [{
        model: Product,
        attributes: ['name']
      }],
      limit: 5,
      order: [['clicks', 'DESC']]
    });

    const formattedPromotions = promotions.map((promotion: any) => {
      const product = promotion.getDataValue('Product');
      const commissionRate = promotion.getDataValue('commissionRate');
      const commissionType = promotion.getDataValue('commissionType');
      
      // Format commission based on type
      const commission = commissionType === 'percentage' 
        ? `${commissionRate}% per sale`
        : `$${commissionRate} per sale`;
        
      return {
        id: promotion.getDataValue('id'),
        name: product ? product.getDataValue('name') : 'Unknown Product',
        commission,
        clicks: promotion.getDataValue('clicks'),
        conversions: promotion.getDataValue('conversions')
      };
    });

    res.json(formattedPromotions);
  } catch (error) {
    console.error('Error getting active promotions:', error);
    res.status(500).json({ message: 'Failed to get active promotions' });
  }
};

// Get platform statistics
export const getPlatformStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as UserInstance)?.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get count by platform
    const platforms = await SocialMediaAccount.findAll({
      attributes: [
        'platform',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('followerCount')), 'followers']
      ],
      where: { userId },
      group: ['platform']
    });

    // Calculate total accounts and followers
    let totalAccounts = 0;
    let totalFollowers = 0;
    let mostPopularPlatform = '';
    let highestCount = 0;

    // Initialize platform counts
    const platformCount: Record<string, number> = {
      facebook: 0,
      instagram: 0,
      twitter: 0,
      tiktok: 0,
      youtube: 0,
      linkedin: 0,
      pinterest: 0,
      other: 0
    };

    // Process data
    platforms.forEach((platform: any) => {
      const platformName = platform.getDataValue('platform');
      const count = parseInt(platform.getDataValue('count') || '0');
      const followers = parseInt(platform.getDataValue('followers') || '0');
      
      // Update platform count
      if (platformName in platformCount) {
        platformCount[platformName] = count;
      } else {
        platformCount.other += count;
      }
      
      // Track totals
      totalAccounts += count;
      totalFollowers += followers;
      
      // Find most popular platform
      if (count > highestCount) {
        highestCount = count;
        mostPopularPlatform = platformName;
      }
    });

    res.json({
      platformCount,
      totalAccounts,
      totalFollowers,
      mostPopularPlatform
    });
  } catch (error) {
    console.error('Error getting platform statistics:', error);
    res.status(500).json({ message: 'Failed to get platform statistics' });
  }
}; 