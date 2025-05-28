"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentUser = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const models_1 = require("../models");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const email_service_1 = require("../services/email.service");
// Register a new user
const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phone, company, website, bio, role } = req.body;
        // Check if user already exists
        const existingUser = await models_1.User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({
                message: 'User with this email already exists',
            });
        }
        // Hash password
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        // Create a new user
        const user = await models_1.User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            phone,
            company,
            website,
            bio,
            role: 'business',
            active: true,
        });
        // Generate JWT token
        const token = generateToken(user);
        // Return user without password
        const userWithoutPassword = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phone: user.phone,
            company: user.company,
            website: user.website,
            bio: user.bio,
            role: user.role,
        };
        // Send confirmation email
        const emailResult = await email_service_1.emailService.sendConfirmationEmail(`${firstName} ${lastName}`, email);
        // Include email preview URL in development mode
        const emailInfo = process.env.NODE_ENV === 'development'
            ? { emailPreviewUrl: emailResult.previewUrl }
            : {};
        res.status(201).json({
            message: 'User registered successfully',
            user: userWithoutPassword,
            token,
            ...emailInfo
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            message: 'Error registering user',
            error: error.message,
        });
    }
};
exports.register = register;
// Login user
const login = (req, res) => {
    passport_1.default.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({
                message: 'Authentication error',
                error: err.message,
            });
        }
        if (!user) {
            return res.status(401).json({
                message: info?.message || 'Invalid email or password',
            });
        }
        // Check if user account is active
        if (user.active === false) {
            return res.status(403).json({
                message: 'Your account has been deactivated. Please contact support for assistance.'
            });
        }
        // Generate JWT token
        const token = generateToken(user);
        // Return user without password
        const userWithoutPassword = {
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
            active: user.active
        };
        res.status(200).json({
            message: 'Login successful',
            user: userWithoutPassword,
            token,
        });
    })(req, res);
};
exports.login = login;
// Get current user
const getCurrentUser = (req, res) => {
    const user = req.user;
    // Return user without password
    const userWithoutPassword = {
        id: user.id,
        name: user.firstName + ' ' + user.lastName,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        socialMediaAccounts: user.socialMediaAccounts,
    };
    res.status(200).json({
        user: userWithoutPassword,
    });
};
exports.getCurrentUser = getCurrentUser;
// Helper function to generate JWT token
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        email: user.email,
        role: user.role
    }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
