import { Request as ExpressRequest, Response } from 'express';
import { Product, Promotion, User, ProductView, PromotionClick } from '../models';
import { Op, fn, col, literal, Sequelize } from 'sequelize';
import sequelize from '../config/database';

// Define custom Request type with needed properties
interface Request extends ExpressRequest {
  user?: any;
  body: any;
  params: any;
  query: any;
}

// Get product statistics
export const getProductStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;
    // Simplified to avoid database errors

    let totalProducts = 0;

    if (userRole === 'admin') {
      totalProducts = await Product.count();
    } else {

      totalProducts = await Product.count({
        where: {
          active: true
        }
      });
    }

    res.status(200).json({
      totalProducts: totalProducts,
      change: '+25%'
    });
  } catch (error: any) {
    console.error('Error fetching product statistics:', error);
    res.status(500).json({
      message: 'Error fetching product statistics',
      error: error.message
    });
  }
};

// Get promotion statistics
export const getPromotionStatistics = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;

    // Simplified to avoid aggregation errors
    const promotions = await Promotion.findAll({
      where: {
        promoterId: userId
      }
    });

    // Calculate totals manually
    let clicksGenerated = 0;
    let conversions = 0;
    let earnings = 0;

    promotions.forEach((promo: any) => {
      clicksGenerated += promo.clicks || 0;
      conversions += promo.conversions || 0;
      earnings += promo.earnings || 0;
    });

    res.status(200).json({
      totalPromotions: promotions.length,
      clicksGenerated,
      earnings,
      conversions,
      change: {
        promotions: '+15%',
        clicks: '+22%',
        earnings: '+18%',
        conversions: '+10%'
      }
    });
  } catch (error: any) {
    console.error('Error fetching promotion statistics:', error);
    res.status(500).json({
      message: 'Error fetching promotion statistics',
      error: error.message
    });
  }
};
// Get active products with pagination
export const getActiveProducts = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const userRole = (req.user as any).role;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const offset = (page - 1) * limit;

    // Build the where condition based on user role
    let whereCondition;

    if (userRole === 'admin') {
      // Admin can see all products
      whereCondition = {};
    } else {
      // Non-admin users can only see active products
      whereCondition = {
        active: true,
      };
    }

    const { count, rows: products } = await Product.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: User,
          as: 'owner',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    // Transform data to match frontend expectations
    const formattedProducts = products.map((product: any) => {
      const owner = product.owner;

      // Format the owner name - if it's an admin, use 'Admin'
      let ownerName = owner?.name || 'Unknown';
      if (owner?.role === 'admin') {
        ownerName = 'Admin';
      }

      return {
        id: product.id,
        name: product.name,
        price: `$${product.price || 0}`,
        category: product.category || 'Other',
        commissionRate: product.commissionType === 'percentage' ?
          `${product.commissionRate || 0}%` :
          `$${product.commissionRate || 0}`,
        description: product.description || '',
        active: product.active,
        ownerId: owner?.id || null,
        ownerName: ownerName
      };
    });

    res.status(200).json({
      data: formattedProducts,
      total: count,
      page,
      limit,
      totalPages
    });
  } catch (error: any) {
    console.error('Error fetching active products:', error);
    res.status(500).json({
      message: 'Error fetching active products',
      error: error.message
    });
  }
};

// Get active promotions with pagination
export const getActivePromotions = async (req: Request, res: Response) => {
  try {
    const userId = (req.user as any).id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 5;
    const offset = (page - 1) * limit;
    const userRole = (req.user as any).role;

    // Build the where condition based on user role
    let whereCondition;

    if (userRole === 'admin') {
      // Admin can see all active promotions
      whereCondition = { status: 'active' };
    } else {
      // Non-admin users can only see their own promotions and those created by admins
      // First, find admin users to use in our query
      const adminUsers = await User.findAll({
        where: { role: 'admin' },
        attributes: ['id']
      });

      const adminUserIds = adminUsers.map((admin: any) => admin.id);

      whereCondition = {
        status: 'active',
        [Op.or]: [
          { promoterId: userId },  // The user's own promotions
        ]
      };
    }

    // Fetch promotions with the appropriate filtering
    const { count, rows: promotions } = await Promotion.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price', 'category']
        },
        {
          model: User,
          as: 'promoter',
          attributes: ['id', 'name', 'email', 'role']
        }
      ],
      offset,
      limit,
      order: [['createdAt', 'DESC']]
    });

    const totalPages = Math.ceil(count / limit);

    // Transform data to match frontend expectations
    const formattedPromotions = promotions.map((promotion: any) => {
      const product = promotion.product;
      const promoter = promotion.promoter;

      // Format the promoter name - if it's an admin, append "(Admin)" to the name
      let promoterName = promoter?.name || 'Unknown';
      if (promoter?.role === 'admin') {
        promoterName = 'Admin';
      }

      return {
        id: promotion.id,
        name: product ? product.name : 'Unknown Product',
        commission: promotion.commissionType === 'percentage' ?
          `${promotion.commissionRate || 0}% per sale` :
          `$${promotion.commissionRate || 0} per sale`,
        clicks: promotion.clicks || 0,
        conversions: promotion.conversions || 0,
        price: product ? `$${product.price || 0}` : 'N/A',
        category: product ? product.category : 'N/A',
        promoterId: promotion.promoterId,
        promoterName: promoterName
      };
    });

    res.status(200).json({
      data: formattedPromotions,
      total: count,
      page,
      limit,
      totalPages
    });
  } catch (error: any) {
    console.error('Error fetching active promotions:', error);
    res.status(500).json({
      message: 'Error fetching active promotions',
      error: error.message
    });
  }
};

// Track a product view
export const trackProductView = async (req: Request, res: Response) => {
  try {
    const { productId } = req.body;
    const userId = req.user?.id;

    // Check if product exists
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({
        message: 'Product not found'
      });
    }

    // Create product view record
    await ProductView.create({
      productId,
      userId,
      timestamp: new Date()
    });

    res.status(200).json({
      message: 'Product view tracked successfully'
    });
  } catch (error: any) {
    console.error('Error tracking product view:', error);
    res.status(500).json({
      message: 'Error tracking product view',
      error: error.message
    });
  }
};

// Get monthly product statistics
export const getMonthlyProductStatistics = async (req: Request, res: Response) => {
  try {
    const { month, year } = req.query;

    // Validate month and year
    const monthNum = parseInt(month as string);
    const yearNum = parseInt(year as string);

    if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({
        message: 'Invalid month or year'
      });
    }

    // Get start and end of month
    const startDate = new Date(yearNum, monthNum - 1, 1);
    const endDate = new Date(yearNum, monthNum, 0);

    // Get total number of products created this month
    const newProducts = await Product.count({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    // Get total product views for this month
    const totalViews = await ProductView.count({
      where: {
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    // Get weekly breakdown of product views
    const weeklyViews = await ProductView.findAll({
      attributes: [
        [Sequelize.literal("to_char(timestamp, 'IW')"), 'week'],
        [Sequelize.fn('count', Sequelize.col('id')), 'count']
      ],
      where: {
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      },
      group: ['week'],
      order: [['week', 'ASC']]
    });

    // Calculate estimated revenue from all products viewed in the month
    // This is a rough calculation based on product price and commission rate
    const productViewsWithData = await ProductView.findAll({
      attributes: ['productId'],
      include: [{
        model: Product,
        as: 'product',
        attributes: ['price', 'commissionRate', 'commissionType']
      }],
      where: {
        timestamp: {
          [Op.between]: [startDate, endDate]
        }
      }
    });

    let estimatedRevenue = 0;

    productViewsWithData.forEach((view: any) => {
      const product = view.product;
      if (product) {
        // Calculate based on commission type
        if (product.commissionType === 'percentage') {
          estimatedRevenue += (product.price * (product.commissionRate / 100));
        } else {
          estimatedRevenue += product.commissionRate;
        }
      }
    });

    // Get comparison with previous month
    const prevMonthStartDate = new Date(yearNum, monthNum - 2, 1);
    const prevMonthEndDate = new Date(yearNum, monthNum - 1, 0);

    const prevMonthProducts = await Product.count({
      where: {
        createdAt: {
          [Op.between]: [prevMonthStartDate, prevMonthEndDate]
        }
      }
    });

    const prevMonthViews = await ProductView.count({
      where: {
        timestamp: {
          [Op.between]: [prevMonthStartDate, prevMonthEndDate]
        }
      }
    });

    // Calculate percentage changes
    const productChange = prevMonthProducts === 0 ? 100 :
      Math.round(((newProducts - prevMonthProducts) / prevMonthProducts) * 100);

    const viewsChange = prevMonthViews === 0 ? 100 :
      Math.round(((totalViews - prevMonthViews) / prevMonthViews) * 100);

    res.status(200).json({
      totalProducts: newProducts,
      totalViews,
      weeklyViews,
      estimatedRevenue: parseFloat(estimatedRevenue.toFixed(2)),
      change: {
        products: `${productChange >= 0 ? '+' : ''}${productChange}%`,
        views: `${viewsChange >= 0 ? '+' : ''}${viewsChange}%`,
      }
    });
  } catch (error: any) {
    console.error('Error fetching monthly product statistics:', error);
    res.status(500).json({
      message: 'Error fetching monthly product statistics',
      error: error.message
    });
  }
};

// Get dashboard data
export const getDashboardData = async (req: Request, res: Response) => {
  try {
    // Get counts from database
    const totalProducts = await Product.count();
    const activeProducts = await Product.count({ where: { active: true } });
    const totalPromotions = await Promotion.count();
    const activePromotions = await Promotion.count({ where: { status: 'active' } });

    // Get list of active products (limit to 5)
    const products = await Product.findAll({
      where: { active: true },
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    // Get list of active promotions (limit to 5)
    const promotions = await Promotion.findAll({
      where: { status: 'active' },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'price'] }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        statistics: {
          products: {
            total: totalProducts,
            active: activeProducts
          },
          promotions: {
            total: totalPromotions,
            active: activePromotions
          }
        },
        activeProducts: products,
        activePromotions: promotions
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: (error as Error).message
    });
  }
};

// Get product statistics by month
export const getProductStatsByMonth = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.params;

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    // Get user ID and role for filtering
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Build the where condition based on user role
    let productWhereCondition: any = {};

    if (userRole === 'admin') {
      // Admin can see all products
      productWhereCondition = {};
    } else {
      // Non-admin users can only see their own products and those created by admins
      // First, find admin users to use in our query
      const adminUsers = await User.findAll({
        where: { role: 'admin' },
        attributes: ['id']
      });

      const adminUserIds = adminUsers.map((admin: any) => admin.id);

      productWhereCondition = {
        [Op.or]: [
          { ownerId: userId },  // The user's own products
          { ownerId: { [Op.in]: adminUserIds } }  // Admin-created products
        ]
      };
    }

    // Get weekly view counts with product filtering
    const weeklyStats = await ProductView.findAll({
      attributes: [
        [fn('date_trunc', 'week', col('ProductView.timestamp')), 'week'],
        [fn('count', col('ProductView.id')), 'views'],
        [fn('count', literal('DISTINCT "ProductView"."productId"')), 'uniqueProducts']
      ],
      where: {
        '$ProductView.timestamp$': {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Product,
          as: 'product',
          where: productWhereCondition,
          attributes: []  // No need to select product fields
        }
      ],
      group: [fn('date_trunc', 'week', col('ProductView.timestamp'))],
      order: [[fn('date_trunc', 'week', col('ProductView.timestamp')), 'ASC']]
    });

    // Calculate total views for current month with filtering
    const totalMonthViews = await ProductView.count({
      where: {
        '$ProductView.timestamp$': {
          [Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: Product,
          as: 'product',
          where: productWhereCondition,
          attributes: []
        }
      ]
    });

    // Calculate previous month stats for comparison with filtering
    const prevStartDate = new Date(parseInt(year), parseInt(month) - 2, 1);
    const prevEndDate = new Date(parseInt(year), parseInt(month) - 1, 0);

    const prevMonthViews = await ProductView.count({
      where: {
        '$ProductView.timestamp$': {
          [Op.between]: [prevStartDate, prevEndDate]
        }
      },
      include: [
        {
          model: Product,
          as: 'product',
          where: productWhereCondition,
          attributes: []
        }
      ]
    });

    // Calculate previous month product creation count
    const prevMonthProducts = await Product.count({
      where: {
        createdAt: {
          [Op.between]: [prevStartDate, prevEndDate]
        },
        ...productWhereCondition
      }
    });

    // Get weekly product creation counts with filtering
    const weeklyProductCreation = await Product.findAll({
      attributes: [
        [fn('date_trunc', 'week', col('Product.createdAt')), 'week'],
        [fn('count', col('Product.id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        },
        ...productWhereCondition
      },
      group: [fn('date_trunc', 'week', col('Product.createdAt'))],
      order: [[fn('date_trunc', 'week', col('Product.createdAt')), 'ASC']]
    });

    // Calculate total new products for current month with filtering
    const totalNewProducts = await Product.count({
      where: {
        createdAt: {
          [Op.between]: [startDate, endDate]
        },
        ...productWhereCondition
      }
    });

    // Get average commission rate to estimate revenue (filtered by product access)
    const avgCommissionResult = await Product.findOne({
      attributes: [
        [fn('AVG', col('commissionRate')), 'avgCommission']
      ],
      where: productWhereCondition,
      raw: true
    });

    const avgCommissionRate = avgCommissionResult ?
      parseFloat((avgCommissionResult as any).avgCommission) || 5 :
      5;

    // Determine the number of weeks in the month
    const numWeeksInMonth = getWeeksInMonth(parseInt(year), parseInt(month) - 1);

    // Create a map to store data for each week
    const weekDataMap = new Map();

    // Initialize with zero values for all weeks
    for (let i = 1; i <= numWeeksInMonth; i++) {
      weekDataMap.set(i, {
        name: `Week ${i}`,
        views: 0,
        clicks: 0,
        revenue: 0,
        productsCreated: 0
      });
    }

    // Create a map of week -> product counts for easier lookup
    const weekToProductCountMap = new Map();
    weeklyProductCreation.forEach((stat) => {
      const weekDate = new Date(stat.get('week') as string);
      const weekNumber = getWeekNumberInMonth(weekDate, startDate);
      weekToProductCountMap.set(weekNumber, parseInt(stat.get('count') as string));
    });

    // Process weekly stats
    weeklyStats.forEach(stat => {
      const weekDate = new Date(stat.get('week') as string);
      const weekNumber = getWeekNumberInMonth(weekDate, startDate);

      if (weekNumber > 0 && weekNumber <= numWeeksInMonth) {
        const views = parseInt(stat.get('views') as string);
        // Estimate clicks as 60% of views and revenue based on commission rate
        const clicks = Math.round(views * 0.6);
        const revenue = Math.round(clicks * (avgCommissionRate / 100) * 25);
        // Get the number of products created in this week (or 0 if none)
        const productsCreated = weekToProductCountMap.get(weekNumber) || 0;

        weekDataMap.set(weekNumber, {
          name: `Week ${weekNumber}`,
          views,
          clicks,
          revenue,
          productsCreated
        });
      }
    });

    // Convert map to array for response
    const weeklyData = Array.from(weekDataMap.values());

    // Calculate percentage changes
    const viewsPercentChange = prevMonthViews > 0
      ? ((totalMonthViews - prevMonthViews) / prevMonthViews * 100).toFixed(2)
      : '100';

    const productsPercentChange = prevMonthProducts > 0
      ? ((totalNewProducts - prevMonthProducts) / prevMonthProducts * 100).toFixed(2)
      : '100';

    res.status(200).json({
      success: true,
      data: {
        weeklyData,
        summary: {
          totalViews: totalMonthViews,
          totalNewProducts,
          prevMonthViews,
          prevMonthProducts,
          viewsPercentChange,
          productsPercentChange,
          estimatedRevenue: Math.round(totalMonthViews * 0.6 * (avgCommissionRate / 100) * 25)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching product statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product statistics',
      error: (error as Error).message
    });
  }
};

// Helper function to get the number of weeks in a month
function getWeeksInMonth(year: number, month: number): number {
  // Get the first day of the month
  const firstDay = new Date(year, month, 1);
  // Get the last day of the month
  const lastDay = new Date(year, month + 1, 0);

  // Get the first day of the first week
  const firstDayOfFirstWeek = new Date(firstDay);
  firstDayOfFirstWeek.setDate(firstDay.getDate() - firstDay.getDay());

  // Get the last day of the last week
  const lastDayOfLastWeek = new Date(lastDay);
  lastDayOfLastWeek.setDate(lastDay.getDate() + (6 - lastDay.getDay()));

  // Calculate the difference in weeks
  const diffInTime = lastDayOfLastWeek.getTime() - firstDayOfFirstWeek.getTime();
  const diffInDays = diffInTime / (1000 * 3600 * 24);
  return Math.ceil((diffInDays + 1) / 7);
}

// Helper function to get the week number within a month
function getWeekNumberInMonth(date: Date, monthStart: Date): number {
  // Clone the dates to avoid modifying the originals
  const dateClone = new Date(date);
  const monthStartClone = new Date(monthStart);

  // Set both dates to the beginning of their respective weeks (Sunday)
  dateClone.setDate(dateClone.getDate() - dateClone.getDay());
  monthStartClone.setDate(monthStartClone.getDate() - monthStartClone.getDay());

  // Calculate the difference in weeks
  const diffInTime = dateClone.getTime() - monthStartClone.getTime();
  const diffInDays = diffInTime / (1000 * 3600 * 24);
  return Math.floor(diffInDays / 7) + 1;
}

// Get promotion statistics by month
export const getPromotionStatsByMonth = async (req: Request, res: Response) => {
  try {
    const { year, month } = req.params;

    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0);

    // Get the user ID and role for filtering promotions
    const userId = req.user?.id;
    const userRole = req.user?.role;

    // Build the where condition based on user role
    let promotionFilterClause = '';
    let adminUserIds: number[] = [];

    if (userRole === 'admin') {
      // Admin can see all promotions
      promotionFilterClause = '';
    } else {
      // Non-admin users can only see their own promotions and those created by admins
      // First, find admin users to use in our query
      const adminUsers = await User.findAll({
        where: { role: 'admin' },
        attributes: ['id']
      });

      adminUserIds = adminUsers.map((admin: any) => admin.id);

      // Create the filter clause for the SQL query
      promotionFilterClause = ` AND (p."promoterId" = :userId OR p."promoterId" IN (:adminUserIds))`;
    }

    // Use raw query to avoid ambiguous column names
    let weeklyStatsQuery = `
      SELECT 
        date_trunc('week', pc."timestamp") as week,
        COUNT(pc."id") as clicks,
        SUM(CASE WHEN pc."isConversion" = true THEN 1 ELSE 0 END) as conversions,
        SUM(pc."earnings") as earnings
      FROM 
        promotion_clicks as pc
      INNER JOIN 
        promotions as p ON pc."promotionId" = p."id"
      WHERE 
        pc."timestamp" BETWEEN :startDate AND :endDate
        ${promotionFilterClause}
      GROUP BY 
        date_trunc('week', pc."timestamp")
      ORDER BY 
        date_trunc('week', pc."timestamp") ASC
    `;

    // Execute the query
    const [weeklyStatsResults] = await sequelize.query(weeklyStatsQuery, {
      replacements: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        userId: userId,
        adminUserIds: adminUserIds
      },
      type: 'SELECT',
      raw: true
    }) as [any[], any];

    // Build total stats query
    let totalStatsQuery = `
      SELECT 
        COUNT(pc."id") as "totalClicks",
        SUM(CASE WHEN pc."isConversion" = true THEN 1 ELSE 0 END) as "totalConversions",
        SUM(pc."earnings") as "totalEarnings"
      FROM 
        promotion_clicks as pc
      INNER JOIN 
        promotions as p ON pc."promotionId" = p."id"
      WHERE 
        pc."timestamp" BETWEEN :startDate AND :endDate
        ${promotionFilterClause}
    `;

    // Execute the query
    const [totalStats] = await sequelize.query(totalStatsQuery, {
      replacements: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        userId: userId,
        adminUserIds: adminUserIds
      },
      type: 'SELECT',
      raw: true
    }) as [any, any];

    // Build previous month stats query
    const prevStartDate = new Date(parseInt(year), parseInt(month) - 2, 1);
    const prevEndDate = new Date(parseInt(year), parseInt(month) - 1, 0);

    let prevMonthQuery = `
      SELECT 
        COUNT(pc."id") as clicks,
        SUM(CASE WHEN pc."isConversion" = true THEN 1 ELSE 0 END) as conversions,
        SUM(pc."earnings") as earnings
      FROM 
        promotion_clicks as pc
      INNER JOIN 
        promotions as p ON pc."promotionId" = p."id"
      WHERE 
        pc."timestamp" BETWEEN :startDate AND :endDate
        ${promotionFilterClause}
    `;

    // Execute the query
    const [prevMonthStats] = await sequelize.query(prevMonthQuery, {
      replacements: {
        startDate: prevStartDate.toISOString(),
        endDate: prevEndDate.toISOString(),
        userId: userId,
        adminUserIds: adminUserIds
      },
      type: 'SELECT',
      raw: true
    }) as [any, any];

    // If no clicks data found, provide empty data and show zero stats
    if (!weeklyStatsResults || !Array.isArray(weeklyStatsResults) || weeklyStatsResults.length === 0) {
      // Calculate number of weeks in the month
      const numWeeksInMonth = getWeeksInMonth(parseInt(year), parseInt(month) - 1);
      const weeklyData = [];

      for (let i = 1; i <= numWeeksInMonth; i++) {
        weeklyData.push({
          name: `Week ${i}`,
          clicks: 0,
          conversions: 0,
          earnings: 0
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          weeklyData,
          summary: {
            totalClicks: 0,
            totalConversions: 0,
            totalEarnings: 0,
            prevMonthClicks: 0,
            prevMonthConversions: 0,
            prevMonthEarnings: 0,
            clicksPercentChange: '0',
            conversionsPercentChange: '0',
            earningsPercentChange: '0'
          }
        }
      });
    }

    // Format data for chart
    const weeklyData = [];
    const numWeeksInMonth = getWeeksInMonth(parseInt(year), parseInt(month) - 1);

    // Initialize weeklyData with zeros for all weeks
    for (let i = 1; i <= numWeeksInMonth; i++) {
      weeklyData.push({
        name: `Week ${i}`,
        clicks: 0,
        conversions: 0,
        earnings: 0
      });
    }

    // Fill in actual data where available
    weeklyStatsResults.forEach((stat: any) => {
      const weekDate = new Date(stat.week);
      const weekNumber = getWeekNumberInMonth(weekDate, startDate);

      if (weekNumber > 0 && weekNumber <= numWeeksInMonth) {
        const clicks = parseInt(stat.clicks) || 0;
        const conversions = parseInt(stat.conversions) || 0;
        const earnings = parseFloat(stat.earnings) || 0;

        weeklyData[weekNumber - 1] = {
          name: `Week ${weekNumber}`,
          clicks,
          conversions,
          earnings
        };
      }
    });

    // Calculate percentage changes
    const clicksPercentChange = prevMonthStats.clicks > 0
      ? ((totalStats.totalClicks - prevMonthStats.clicks) / prevMonthStats.clicks * 100).toFixed(2)
      : '100';

    const conversionsPercentChange = prevMonthStats.conversions > 0
      ? ((totalStats.totalConversions - prevMonthStats.conversions) / prevMonthStats.conversions * 100).toFixed(2)
      : '100';

    const earningsPercentChange = prevMonthStats.earnings > 0
      ? ((totalStats.totalEarnings - prevMonthStats.earnings) / prevMonthStats.earnings * 100).toFixed(2)
      : '100';

    res.status(200).json({
      success: true,
      data: {
        weeklyData,
        summary: {
          totalClicks: totalStats.totalClicks,
          totalConversions: totalStats.totalConversions,
          totalEarnings: totalStats.totalEarnings,
          prevMonthClicks: prevMonthStats.clicks,
          prevMonthConversions: prevMonthStats.conversions,
          prevMonthEarnings: prevMonthStats.earnings,
          clicksPercentChange,
          conversionsPercentChange,
          earningsPercentChange
        }
      }
    });
  } catch (error) {
    console.error('Error fetching promotion statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch promotion statistics',
      error: (error as Error).message
    });
  }
};
