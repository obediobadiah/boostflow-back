"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const passport_1 = __importDefault(require("passport"));
const models_1 = require("../models");
const express_validator_1 = require("express-validator");
const cors_1 = __importDefault(require("cors"));
const router = express_1.default.Router();
// Enable CORS for all routes
router.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'],
    credentials: true // Allow credentials (cookies, authorization headers, etc.)
}));
// Validation middleware
const validateRegister = [
    (0, express_validator_1.body)('firstName').notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long'),
    (0, express_validator_1.body)('website').optional().isURL().withMessage('Website must be a valid URL'),
];
const validateLogin = [
    (0, express_validator_1.body)('email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
// Generate JWT token for user
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
// User object to return in responses
const getUserData = (user) => {
    return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        active: user.active,
        profilePicture: user.profilePicture,
    };
};
// Define the expected structure of the request body
// interface RegisterRequestBody {
//   name: string;
//   email: string;
//   password: string;
//   role?: string;
// }
// Registration route
router.post('/register', validateRegister, async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        const { firstName, lastName, email, password, phone, company, website, bio, role } = req.body;
        // Check if user already exists
        const existingUser = await models_1.User.findOne({ where: { email } });
        if (existingUser) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // Create new user
        const user = await models_1.User.create({
            firstName,
            lastName,
            email,
            password, // Password will be hashed by the model hook
            phone,
            company,
            website,
            bio,
            role: role || 'business',
        });
        // Generate JWT token
        const token = generateToken(user);
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone,
                company: user.company,
                website: user.website,
                bio: user.bio,
                role: user.role,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
// Login route
router.post('/login', validateLogin, (req, res, next) => {
    // Check for validation errors
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    passport_1.default.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            res.status(401).json({ message: info.message || 'Authentication failed' });
            return;
        }
        // Check if user account is active
        if (user.active === false) {
            return res.status(403).json({
                message: 'Your account has been deactivated. Please contact support for assistance.'
            });
        }
        // Generate JWT token
        const token = generateToken(user);
        res.json({
            message: 'Login successful',
            token,
            user: getUserData(user),
        });
    })(req, res, next);
});
// Google OAuth routes
router.get('/google', passport_1.default.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
}));
router.get('/google/callback', passport_1.default.authenticate('google', { session: false, failureRedirect: '/login' }), (req, res) => {
    const user = req.user;
    const token = generateToken(user);
    // Log the redirect and token information
    console.log('Google authentication successful, redirecting to frontend with token');
    const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'];
    const redirectUrl = allowedOrigins.includes('*') ? `http://localhost:3000/auth/callback?token=${token}` : `http://${allowedOrigins[0]}/auth/callback?token=${token}`;
    console.log('Redirecting to:', redirectUrl);
    // Redirect to frontend with token
    res.redirect(redirectUrl);
});
// Get current user route (protected)
router.get('/me', passport_1.default.authenticate('jwt', { session: false }), (req, res) => {
    const user = req.user;
    res.json(getUserData(user));
});
exports.default = router;
