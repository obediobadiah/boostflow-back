"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const passport_1 = __importDefault(require("passport"));
const passport_jwt_1 = require("passport-jwt");
const passport_local_1 = require("passport-local");
const passport_google_oauth20_1 = require("passport-google-oauth20");
const dotenv_1 = __importDefault(require("dotenv"));
const user_model_1 = __importDefault(require("../models/user.model"));
dotenv_1.default.config();
// JWT Strategy for token verification
const jwtOptions = {
    jwtFromRequest: passport_jwt_1.ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET || 'fallback_secret_for_dev',
};
passport_1.default.use(new passport_jwt_1.Strategy(jwtOptions, async (payload, done) => {
    try {
        // Validate payload
        if (!payload || !payload.id) {
            return done(null, false);
        }
        // Find user by ID
        const user = await user_model_1.default.findByPk(payload.id);
        if (!user) {
            return done(null, false);
        }
        // Return user if found
        return done(null, user);
    }
    catch (error) {
        console.error('JWT authentication error:', error);
        return done(error, false);
    }
}));
// Local Strategy for email/password login
passport_1.default.use(new passport_local_1.Strategy({ usernameField: 'email' }, async (email, password, done) => {
    try {
        const user = await user_model_1.default.findOne({ where: { email } });
        if (!user) {
            return done(null, false, { message: 'User not found' });
        }
        // Check if user account is active
        if (user.active === false) {
            return done(null, false, { message: 'Your account has been deactivated. Please contact support for assistance.' });
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return done(null, false, { message: 'Incorrect password' });
        }
        return done(null, user);
    }
    catch (error) {
        return done(error);
    }
}));
// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    console.log('Initializing Google OAuth strategy');
    passport_1.default.use(new passport_google_oauth20_1.Strategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback',
        scope: ['profile', 'email']
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            console.log('Google authentication successful for profile:', profile.id);
            // Check if user already exists
            let user = await user_model_1.default.findOne({
                where: { googleId: profile.id },
            });
            if (!user) {
                console.log('User not found by googleId, checking email');
                // Check if user with the same email exists
                if (profile.emails && profile.emails.length > 0) {
                    const email = profile.emails[0].value;
                    console.log('Looking up user by email:', email);
                    user = await user_model_1.default.findOne({ where: { email } });
                    if (user) {
                        // Link the Google ID to the existing account
                        console.log('Found existing user by email, linking Google account');
                        await user.update({
                            googleId: profile.id,
                            // Update profile picture if not already set
                            profilePicture: user.profilePicture || profile.photos?.[0].value || ''
                        });
                    }
                    else {
                        // Create a new user
                        console.log('Creating new user from Google profile');
                        const nameParts = profile.displayName?.split(' ') || ['', ''];
                        const firstName = nameParts[0] || '';
                        const lastName = nameParts.slice(1).join(' ') || '';
                        user = await user_model_1.default.create({
                            googleId: profile.id,
                            email: profile.emails?.[0].value || '',
                            firstName,
                            lastName,
                            profilePicture: profile.photos?.[0].value || '',
                            role: 'business',
                        });
                    }
                }
            }
            else {
                console.log('Found existing user by googleId');
            }
            return done(null, user || false);
        }
        catch (error) {
            console.error('Error during Google authentication:', error);
            return done(error, false);
        }
    }));
}
else {
    console.log('Google OAuth is not configured - missing API keys');
}
exports.default = passport_1.default;
