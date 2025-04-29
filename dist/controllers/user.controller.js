"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.updateProfile = exports.getUserById = void 0;
const models_1 = require("../models");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const sequelize_1 = require("sequelize");
// Get user profile by ID
const getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await models_1.User.findByPk(userId, {
            attributes: { exclude: ['password'] },
            include: [{
                    model: models_1.SocialMediaAccount,
                    as: 'socialMediaAccounts'
                }]
        });
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }
        res.status(200).json({
            user,
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error fetching user',
            error: error.message,
        });
    }
};
exports.getUserById = getUserById;
// Update user profile
const updateProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { name, email, profilePicture } = req.body;
        // Check if email is already taken by another user
        if (email) {
            const existingUser = await models_1.User.findOne({
                where: {
                    email,
                    id: { [sequelize_1.Op.ne]: userId }
                }
            });
            if (existingUser) {
                return res.status(400).json({
                    message: 'Email is already in use by another account',
                });
            }
        }
        const user = await models_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }
        await user.update({
            name,
            email,
            profilePicture
        });
        // Get updated user without password
        const updatedUser = await models_1.User.findByPk(userId, {
            attributes: { exclude: ['password'] }
        });
        res.status(200).json({
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error updating profile',
            error: error.message,
        });
    }
};
exports.updateProfile = updateProfile;
// Change password
const changePassword = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { currentPassword, newPassword } = req.body;
        // Validate input
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                message: 'Current password and new password are required',
            });
        }
        // Get user with password
        const user = await models_1.User.findByPk(userId);
        if (!user) {
            return res.status(404).json({
                message: 'User not found',
            });
        }
        // Check if current password is correct
        const isMatch = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({
                message: 'Current password is incorrect',
            });
        }
        // Hash new password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
        // Update password
        await user.update({
            password: hashedPassword
        });
        res.status(200).json({
            message: 'Password changed successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            message: 'Error changing password',
            error: error.message,
        });
    }
};
exports.changePassword = changePassword;
