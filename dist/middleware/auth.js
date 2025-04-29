"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ message: 'Authentication failed: No auth token' });
            return;
        }
        if (!authHeader.startsWith('Bearer ')) {
            res.status(401).json({ message: 'Authentication failed: Invalid token format' });
            return;
        }
        const token = authHeader.substring(7);
        if (!token || token.trim() === '') {
            res.status(401).json({ message: 'Authentication failed: Empty token' });
            return;
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'secret');
            if (!decoded || !decoded.id) {
                res.status(401).json({ message: 'Authentication failed: Invalid token payload' });
                return;
            }
            const user = await models_1.User.findByPk(decoded.id);
            if (!user) {
                res.status(401).json({ message: 'Authentication failed: User not found' });
                return;
            }
            req.user = { id: user.id };
            next();
        }
        catch (jwtError) {
            res.status(401).json({
                message: 'Authentication failed: Invalid token',
                error: jwtError.message
            });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error during authentication' });
    }
};
exports.authenticateToken = authenticateToken;
