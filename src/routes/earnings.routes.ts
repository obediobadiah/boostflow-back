import express, { Request, Response, RequestHandler } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { Earnings } from '../models/earnings.model';
import { Op } from 'sequelize';
import sequelize from '../config/database';

import {
  getUserEarnings,
  getEarningsStats,
  createEarnings,
  updateEarningsStatus,
  getEarningsByPromotion
} from '../controllers/earnings.controller';

interface MonthlyEarning {
  month: Date;
  amount: string;
}

interface RequestWithQuery extends Request {
  query: {
    page?: string;
    limit?: string;
    startDate?: string;
    endDate?: string;
  };
}

const router = express.Router();

// Apply auth middleware to all routes
router.use(authenticate as RequestHandler);

// Get user's earnings with pagination
router.get('/user', (async (req: RequestWithQuery, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const page = parseInt(req.query.page || '1');
      const limit = parseInt(req.query.limit || '10');
      const offset = (page - 1) * limit;

      const { count, rows: earnings } = await Earnings.findAndCountAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          earnings,
          total: count,
          page,
          limit,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching user earnings:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching earnings',
        error: (error as Error).message
      });
    }
  }) as unknown as RequestHandler);

// Get earnings statistics
router.get('/stats', (async (req: RequestWithQuery, res: Response) => {
  try {
    const userId = (req.user as any).id;

    // Get total earnings
    const totalEarnings = await Earnings.sum('amount', {
      where: { userId }
    });

    // Get earnings by status
    const pendingEarnings = await Earnings.sum('amount', {
      where: { 
        userId,
        status: 'pending'
      }
    });

    const paidEarnings = await Earnings.sum('amount', {
      where: { 
        userId,
        status: 'paid'
      }
    });

    const cancelledEarnings = await Earnings.sum('amount', {
      where: { 
        userId,
        status: 'cancelled'
      }
    });

    // Get monthly earnings for the last 12 months
    const monthlyEarnings = await Earnings.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'month'],
        [sequelize.fn('sum', sequelize.col('amount')), 'amount']
      ],
      where: {
        userId,
        createdAt: {
          [Op.gte]: new Date(new Date().setMonth(new Date().getMonth() - 12))
        }
      },
      group: [sequelize.fn('date_trunc', 'month', sequelize.col('createdAt'))],
      order: [[sequelize.fn('date_trunc', 'month', sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    // Format monthly earnings data
    const formattedMonthlyEarnings = (monthlyEarnings as unknown as MonthlyEarning[]).map(item => ({
      month: new Date(item.month).toLocaleString('default', { month: 'short', year: 'numeric' }),
      amount: parseFloat(item.amount)
    }));

    res.json({
      success: true,
      data: {
        totalEarnings: totalEarnings || 0,
        pendingEarnings: pendingEarnings || 0,
        paidEarnings: paidEarnings || 0,
        cancelledEarnings: cancelledEarnings || 0,
        monthlyEarnings: formattedMonthlyEarnings
      }
    });
  } catch (error) {
    console.error('Error fetching earnings stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching earnings statistics',
      error: (error as Error).message
    });
  }
}) as unknown as RequestHandler);

// Get earnings by date range
router.get('/range', (async (req: RequestWithQuery, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const { startDate, endDate } = req.query;
      const page = parseInt(req.query.page || '1');
      const limit = parseInt(req.query.limit || '10');
      const offset = (page - 1) * limit;

      const whereClause: any = { userId };

      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const { count, rows: earnings } = await Earnings.findAndCountAll({
        where: whereClause,
        order: [['createdAt', 'DESC']],
        limit,
        offset
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          earnings,
          total: count,
          page,
          limit,
          totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching earnings by date range:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching earnings',
        error: (error as Error).message
      });
    }
  }) as unknown as unknown as RequestHandler);

// Create new earnings record
router.post('/', createEarnings as unknown as RequestHandler);

// Update earnings status
router.patch('/:id/status', updateEarningsStatus as unknown as RequestHandler);

// Get earnings by promotion
router.get('/promotion/:promotionId', getEarningsByPromotion as unknown as RequestHandler);

export default router; 