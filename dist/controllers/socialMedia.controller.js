"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSocialMediaAccount = exports.disconnectSocialMediaAccount = exports.updateSocialMediaAccount = exports.createSocialMediaAccount = exports.getSocialMediaAccount = exports.getSocialMediaAccounts = void 0;
const models_1 = require("../models");
const express_validator_1 = require("express-validator");
// Get all social media accounts for the authenticated user
const getSocialMediaAccounts = async (req, res, next) => {
    try {
        const user = req.user;
        const accounts = await models_1.SocialMediaAccount.findAll({
            where: { userId: user.id }
        });
        res.json(accounts);
    }
    catch (error) {
        next(error);
    }
};
exports.getSocialMediaAccounts = getSocialMediaAccounts;
// Get a specific social media account by ID
const getSocialMediaAccount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;
        const account = await models_1.SocialMediaAccount.findOne({
            where: {
                id,
                userId: user.id
            }
        });
        if (!account) {
            return res.status(404).json({ message: 'Social media account not found' });
        }
        res.json(account);
    }
    catch (error) {
        next(error);
    }
};
exports.getSocialMediaAccount = getSocialMediaAccount;
// Create a new social media account
const createSocialMediaAccount = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const user = req.user;
        const { platform, username, accountId, accessToken, refreshToken, tokenExpiry, followerCount } = req.body;
        // Check if user already has an account for this platform
        const existingAccount = await models_1.SocialMediaAccount.findOne({
            where: {
                userId: user.id,
                platform
            }
        });
        if (existingAccount) {
            return res.status(400).json({ message: `You already have a ${platform} account connected` });
        }
        // Create the social media account
        const account = await models_1.SocialMediaAccount.create({
            userId: user.id,
            platform,
            username,
            accountId,
            accessToken,
            refreshToken,
            tokenExpiry: tokenExpiry || undefined,
            isConnected: true,
            connectionDate: new Date(),
            followerCount: followerCount || 0,
            metadata: {}
        });
        // Remove sensitive data before sending response
        const accountData = account.get({ plain: true });
        delete accountData.accessToken;
        delete accountData.refreshToken;
        res.status(201).json({
            message: 'Social media account connected successfully',
            account: accountData
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createSocialMediaAccount = createSocialMediaAccount;
// Update a social media account
const updateSocialMediaAccount = async (req, res, next) => {
    try {
        // Check for validation errors
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { id } = req.params;
        const user = req.user;
        // Find the account
        const account = await models_1.SocialMediaAccount.findOne({
            where: {
                id,
                userId: user.id
            }
        });
        if (!account) {
            return res.status(404).json({ message: 'Social media account not found' });
        }
        const { username, accountId, accessToken, refreshToken, tokenExpiry, followerCount, isConnected } = req.body;
        // Update the account
        await account.update({
            username: username || account.get('username'),
            accountId: accountId || account.get('accountId'),
            accessToken: accessToken || account.get('accessToken'),
            refreshToken: refreshToken || account.get('refreshToken'),
            tokenExpiry: tokenExpiry || account.get('tokenExpiry'),
            isConnected: isConnected !== undefined ? isConnected : account.get('isConnected'),
            followerCount: followerCount || account.get('followerCount')
        });
        // Remove sensitive data before sending response
        const accountData = account.get({ plain: true });
        delete accountData.accessToken;
        delete accountData.refreshToken;
        res.json({
            message: 'Social media account updated successfully',
            account: accountData
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateSocialMediaAccount = updateSocialMediaAccount;
// Disconnect a social media account
const disconnectSocialMediaAccount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;
        // Find the account
        const account = await models_1.SocialMediaAccount.findOne({
            where: {
                id,
                userId: user.id
            }
        });
        if (!account) {
            return res.status(404).json({ message: 'Social media account not found' });
        }
        // Update the account
        await account.update({
            isConnected: false,
            accessToken: '',
            refreshToken: '',
            tokenExpiry: undefined
        });
        res.json({
            message: 'Social media account disconnected successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.disconnectSocialMediaAccount = disconnectSocialMediaAccount;
// Delete a social media account
const deleteSocialMediaAccount = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = req.user;
        // Find the account
        const account = await models_1.SocialMediaAccount.findOne({
            where: {
                id,
                userId: user.id
            }
        });
        if (!account) {
            return res.status(404).json({ message: 'Social media account not found' });
        }
        // Delete the account
        await account.destroy();
        res.json({
            message: 'Social media account deleted successfully'
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteSocialMediaAccount = deleteSocialMediaAccount;
