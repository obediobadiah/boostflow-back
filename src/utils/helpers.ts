import crypto from 'crypto';
import { Promotion } from '../models';

/**
 * Generate a unique tracking code for promotions
 */
export const generateTrackingCode = async (): Promise<string> => {
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

/**
 * Generate a tracking code based on specific parameters
 */
export const generateTrackingCodeWithParams = (userId: number, productId: number): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${userId}${productId}${timestamp}${randomStr}`.substring(0, 12);
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

/**
 * Calculate earnings based on commission type and rate
 */
export const calculateEarnings = (
  saleAmount: number,
  commissionRate: number,
  commissionType: 'percentage' | 'fixed'
): number => {
  if (commissionType === 'percentage') {
    return (saleAmount * commissionRate) / 100;
  } else {
    return commissionRate;
  }
};

/**
 * Generate random string
 */
export const generateRandomString = (length: number = 10): string => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}; 