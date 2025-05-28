"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const authenticate = async (req, res, next) => {
    try {
        // Cast req to any to avoid TypeScript errors with headers
        const reqAny = req;
        const authHeader = reqAny.headers.authorization;
        // Check if Authorization header exists
        if (!authHeader) {
            return res.status(401).json({ message: 'No authorization header provided' });
        }
        // Check if Authorization header has correct format
        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Invalid authorization header format' });
        }
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        if (!token || token.trim() === '') {
            return res.status(401).json({ message: 'No token provided' });
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            if (!decoded || !decoded.id) {
                return res.status(401).json({ message: 'Invalid token payload' });
            }
            const user = await models_1.User.findByPk(decoded.id);
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }
            // Add user to request
            reqAny.user = user;
            next();
        }
        catch (jwtError) {
            console.error('Token verification error:', jwtError);
            return res.status(401).json({
                message: 'Invalid token',
                error: jwtError.message
            });
        }
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ message: 'Server error during authentication' });
    }
};
exports.authenticate = authenticate;
