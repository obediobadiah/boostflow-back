"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateRandomString = exports.calculateEarnings = exports.formatCurrency = exports.generateTrackingCodeWithParams = exports.generateTrackingCode = void 0;
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
/**
 * Generate a unique tracking code for promotions
 */
const generateTrackingCode = async () => {
    // Generate a random string
    const randomBytes = crypto_1.default.randomBytes(8).toString('hex');
    // Create a tracking code with a prefix
    const trackingCode = `BF-${randomBytes}`;
    // Check if it already exists
    const existingPromotion = await models_1.Promotion.findOne({
        where: { trackingCode }
    });
    // If exists, generate a new one recursively
    if (existingPromotion) {
        return (0, exports.generateTrackingCode)();
    }
    return trackingCode;
};
exports.generateTrackingCode = generateTrackingCode;
/**
 * Generate a tracking code based on specific parameters
 */
const generateTrackingCodeWithParams = (userId, productId) => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `${userId}${productId}${timestamp}${randomStr}`.substring(0, 12);
};
exports.generateTrackingCodeWithParams = generateTrackingCodeWithParams;
/**
 * Format currency amount
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(amount);
};
exports.formatCurrency = formatCurrency;
/**
 * Calculate earnings based on commission type and rate
 */
const calculateEarnings = (saleAmount, commissionRate, commissionType) => {
    if (commissionType === 'percentage') {
        return (saleAmount * commissionRate) / 100;
    }
    else {
        return commissionRate;
    }
};
exports.calculateEarnings = calculateEarnings;
/**
 * Generate random string
 */
const generateRandomString = (length = 10) => {
    return crypto_1.default.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};
exports.generateRandomString = generateRandomString;
