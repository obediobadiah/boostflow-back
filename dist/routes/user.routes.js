"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const models_1 = require("../models");
const express_validator_1 = require("express-validator");
const router = express_1.default.Router();
// Middleware to check if user is authenticated
const authenticate = passport_1.default.authenticate('jwt', { session: false });
// Middleware to check if user is an admin
const isAdmin = (req, res, next) => {
    const user = req.user;
    if (user && user.role === 'admin') {
        return next();
    }
    res.status(403).json({ message: 'Access denied. Admin role required.' });
    return;
};
// Update user profile validation
const validateProfileUpdate = [
    (0, express_validator_1.body)('name').optional().notEmpty().withMessage('Name cannot be empty'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('profilePicture').optional().isURL().withMessage('Profile picture must be a valid URL'),
];
// User object to return in responses (in getUserData function or similar)
// This might be named differently in your codebase
const mapUserResponse = (user) => {
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        profilePicture: user.profilePicture,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
};
// Get all users (admin only)
router.get('/', authenticate, isAdmin, async (_req, res, next) => {
    try {
        const users = await models_1.User.findAll({
            attributes: ['id', 'name', 'email', 'role', 'profilePicture', 'active', 'createdAt']
        });
        res.json(users);
    }
    catch (error) {
        next(error);
    }
});
// Get user by ID
router.get('/:id', authenticate, async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await models_1.User.findByPk(id, {
            attributes: ['id', 'name', 'email', 'role', 'profilePicture', 'active', 'createdAt']
        });
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        res.json(user);
    }
    catch (error) {
        next(error);
    }
});
// Update user profile
router.put('/profile', authenticate, validateProfileUpdate, async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const user = req.user;
        const { name, email, profilePicture } = req.body;
        // Only update the fields that were sent
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email)
            updateData.email = email;
        if (profilePicture)
            updateData.profilePicture = profilePicture;
        // Update user in database
        await models_1.User.update(updateData, { where: { id: user.id } });
        // Get updated user data
        const updatedUser = await models_1.User.findByPk(user.id, {
            attributes: ['id', 'name', 'email', 'role', 'profilePicture', 'createdAt']
        });
        res.json({
            message: 'Profile updated successfully',
            user: updatedUser
        });
    }
    catch (error) {
        next(error);
    }
});
// Change password
router.put('/change-password', authenticate, [
    (0, express_validator_1.body)('currentPassword').notEmpty().withMessage('Current password is required'),
    (0, express_validator_1.body)('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long')
], async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const user = req.user;
        const { currentPassword, newPassword } = req.body;
        // Get user from database to have access to instance methods
        const dbUser = await models_1.User.findByPk(user.id);
        if (!dbUser) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Verify current password
        const isMatch = await dbUser.comparePassword(currentPassword);
        if (!isMatch) {
            res.status(400).json({ message: 'Current password is incorrect' });
            return;
        }
        // Update password
        dbUser.password = newPassword;
        await dbUser.save();
        res.json({ message: 'Password changed successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Delete account (self)
router.delete('/account', authenticate, async (req, res, next) => {
    try {
        const user = req.user;
        // Delete user
        await models_1.User.destroy({ where: { id: user.id } });
        res.json({ message: 'Account deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
// Update user role (admin only)
router.put('/:id/role', authenticate, isAdmin, [
    (0, express_validator_1.body)('role').isIn(['admin', 'business', 'promoter']).withMessage('Role must be admin, business, or promoter')
], async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { id } = req.params;
        const { role } = req.body;
        // Ensure the user exists
        const user = await models_1.User.findByPk(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Update role in database
        await models_1.User.update({ role }, { where: { id } });
        // Get updated user data
        const updatedUser = await models_1.User.findByPk(id, {
            attributes: ['id', 'name', 'email', 'role', 'profilePicture', 'active', 'createdAt', 'updatedAt']
        });
        res.json({
            message: 'User role updated successfully',
            user: updatedUser
        });
    }
    catch (error) {
        next(error);
    }
});
// Update user (admin only)
router.put('/:id', authenticate, isAdmin, validateProfileUpdate, async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { id } = req.params;
        const { name, email, role, active, password } = req.body;
        // Ensure the user exists
        const user = await models_1.User.findByPk(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Create update payload without password
        const updateData = {};
        if (name !== undefined)
            updateData.name = name;
        if (email !== undefined)
            updateData.email = email;
        if (role !== undefined)
            updateData.role = role;
        if (active !== undefined)
            updateData.active = active;
        // Update user in database
        await models_1.User.update(updateData, { where: { id } });
        // If password is provided, update it separately using the User instance
        if (password) {
            // Get user instance to trigger the password hash hook
            const userInstance = await models_1.User.findByPk(id);
            if (userInstance) {
                userInstance.password = password;
                await userInstance.save();
            }
        }
        // Get updated user data
        const updatedUser = await models_1.User.findByPk(id, {
            attributes: ['id', 'name', 'email', 'role', 'profilePicture', 'active', 'createdAt', 'updatedAt']
        });
        res.json({
            message: 'User updated successfully',
            user: updatedUser
        });
    }
    catch (error) {
        next(error);
    }
});
// Delete user (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res, next) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;
        // Prevent admin from deleting themselves
        if (id.toString() === adminId.toString()) {
            res.status(400).json({ message: 'Cannot delete your own admin account' });
            return;
        }
        // Ensure the user exists
        const user = await models_1.User.findByPk(id);
        if (!user) {
            res.status(404).json({ message: 'User not found' });
            return;
        }
        // Delete user
        await models_1.User.destroy({ where: { id } });
        res.json({ message: 'User deleted successfully' });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
