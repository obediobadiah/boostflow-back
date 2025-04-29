"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocialMediaPost = void 0;
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
// Create Promotion model
const Promotion = database_1.default.define('Promotion', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    productId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'products',
            key: 'id',
        },
    },
    promoterId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    trackingCode: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    commissionRate: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
    },
    commissionType: {
        type: sequelize_1.DataTypes.ENUM('percentage', 'fixed'),
        defaultValue: 'percentage',
    },
    status: {
        type: sequelize_1.DataTypes.ENUM('active', 'inactive', 'banned'),
        defaultValue: 'active',
    },
    clicks: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    conversions: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    earnings: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
    },
    affiliateLink: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    customImages: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: [],
    },
    autoPostToSocial: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, {
    tableName: 'promotions',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['productId', 'promoterId'],
        },
    ],
});
// Create SocialMediaPost model
const SocialMediaPost = database_1.default.define('SocialMediaPost', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    promotionId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'promotions',
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
    postUrl: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            isUrl: true,
        },
    },
    postId: {
        type: sequelize_1.DataTypes.STRING,
    },
    postDate: {
        type: sequelize_1.DataTypes.DATE,
        defaultValue: sequelize_1.DataTypes.NOW,
    },
    content: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    images: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: [],
    },
    clicks: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    conversions: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
}, {
    tableName: 'social_media_posts',
    timestamps: true,
});
exports.SocialMediaPost = SocialMediaPost;
// Define associations
Promotion.hasMany(SocialMediaPost, {
    foreignKey: 'promotionId',
    as: 'socialMediaPosts',
    onDelete: 'CASCADE',
});
SocialMediaPost.belongsTo(Promotion, { foreignKey: 'promotionId' });
exports.default = Promotion;
