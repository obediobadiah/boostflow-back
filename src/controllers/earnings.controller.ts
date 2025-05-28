import { Request as ExpressRequest, Response } from 'express';
import { Earnings } from '../models/earnings.model';
import Promotion from '../models/promotion.model';
import { calculateEarnings } from '../utils/helpers';
import { Op } from 'sequelize';
import { sequelize } from '../models';

interface Request extends ExpressRequest {
  user?: any;
  body: any;
  params: any;
  query: any;
}

// Get user's earnings
export const getUserEarnings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { startDate, endDate, status } = req.query as { 
      startDate?: string;
      endDate?: string;
      status?: string;
    };

    const whereClause: any = { userId };

    if (startDate && endDate) {
      whereClause.createdAt = {
        [Op.between]: [new Date(startDate as string), new Date(endDate as string)]
      };
    }

    if (status) {
      whereClause.status = status;
    }

    const earnings = await Earnings.findAll({
      where: whereClause,
      include: [{
        model: Promotion,
        as: 'promotion',
        attributes: ['name', 'commissionRate', 'commissionType']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: earnings
    });
  } catch (error: any) {
    console.error('Error fetching user earnings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching earnings',
      error: error.message
    });
  }
};

// Get earnings statistics
export const getEarningsStats = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { year, month } = req.query;

    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);

    // Get total earnings for the month
    const totalEarnings = await Earnings.sum('amount', {
      where: {
        userId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        },
        status: 'paid'
      }
    });

    // Get earnings by week
    const weeklyEarnings = await Earnings.findAll({
      attributes: [
        [sequelize.fn('date_trunc', 'week', sequelize.col('createdAt')), 'week'],
        [sequelize.fn('sum', sequelize.col('amount')), 'total']
      ],
      where: {
        userId,
        createdAt: {
          [Op.between]: [startDate, endDate]
        },
        status: 'paid'
      },
      group: [sequelize.fn('date_trunc', 'week', sequelize.col('createdAt'))],
      order: [[sequelize.fn('date_trunc', 'week', sequelize.col('createdAt')), 'ASC']]
    });

    // Get previous month's earnings for comparison
    const prevStartDate = new Date(parseInt(year as string), parseInt(month as string) - 2, 1);
    const prevEndDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 0);

    const prevMonthEarnings = await Earnings.sum('amount', {
      where: {
        userId,
        createdAt: {
          [Op.between]: [prevStartDate, prevEndDate]
        },
        status: 'paid'
      }
    });

    // Calculate percentage change
    const earningsPercentChange = prevMonthEarnings > 0
      ? ((totalEarnings - prevMonthEarnings) / prevMonthEarnings * 100).toFixed(2)
      : '100';

    res.status(200).json({
      success: true,
      data: {
        totalEarnings: totalEarnings || 0,
        weeklyEarnings,
        prevMonthEarnings: prevMonthEarnings || 0,
        earningsPercentChange
      }
    });
  } catch (error: any) {
    console.error('Error fetching earnings statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching earnings statistics',
      error: error.message
    });
  }
};

// Create new earnings record
export const createEarnings = async (req: Request, res: Response) => {
  try {
    const { promotionId, amount, type, description } = req.body;
    const userId = req.user?.id;

    if (!userId || !promotionId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const earnings = await Earnings.create({
      userId,
      promotionId,
      amount,
      type: type || 'commission',
      status: 'pending',
      description
    });

    res.status(201).json({
      success: true,
      data: earnings
    });
  } catch (error: any) {
    console.error('Error creating earnings record:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating earnings record',
      error: error.message
    });
  }
};

// Update earnings status
export const updateEarningsStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentDate } = req.body;
    const userId = req.user?.id;

    const earnings = await Earnings.findOne({
      where: { id, userId }
    });

    if (!earnings) {
      return res.status(404).json({
        success: false,
        message: 'Earnings record not found'
      });
    }

    await earnings.update({
      status,
      paymentDate: status === 'paid' ? paymentDate || new Date() : null
    });

    res.status(200).json({
      success: true,
      data: earnings
    });
  } catch (error: any) {
    console.error('Error updating earnings status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating earnings status',
      error: error.message
    });
  }
};

// Get earnings by promotion
export const getEarningsByPromotion = async (req: Request, res: Response) => {
  try {
    const { promotionId } = req.params;
    const userId = req.user?.id;

    const earnings = await Earnings.findAll({
      where: {
        promotionId,
        userId
      },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      data: earnings
    });
  } catch (error: any) {
    console.error('Error fetching earnings by promotion:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching earnings by promotion',
      error: error.message
    });
  }
}; 