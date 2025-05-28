"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
// Create SocialMediaAccount model
const SocialMediaAccount = database_1.default.define('SocialMediaAccount', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    userId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    platform: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            isIn: [['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'linkedin', 'pinterest', 'other']],
        },
    },
    username: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    accountId: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    accessToken: {
        type: sequelize_1.DataTypes.TEXT,
    },
    refreshToken: {
        type: sequelize_1.DataTypes.TEXT,
    },
    tokenExpiry: {
        type: sequelize_1.DataTypes.DATE,
    },
    isConnected: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
    connectionDate: {
        type: sequelize_1.DataTypes.DATE,
    },
    lastPostDate: {
        type: sequelize_1.DataTypes.DATE,
    },
    followerCount: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    metadata: {
        type: sequelize_1.DataTypes.JSON,
        defaultValue: {},
    },
}, {
    tableName: 'social_media_accounts',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId', 'platform'],
            name: 'social_media_accounts_user_id_platform_unique',
            using: 'BTREE'
        },
    ],
});
exports.default = SocialMediaAccount;
