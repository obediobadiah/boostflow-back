"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const database_1 = __importDefault(require("../config/database"));
// Create Product model
const Product = database_1.default.define('Product', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [3, 100],
        },
    },
    description: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false,
    },
    price: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0,
        },
    },
    images: {
        type: sequelize_1.DataTypes.ARRAY(sequelize_1.DataTypes.STRING),
        defaultValue: [],
    },
    ownerId: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id',
        },
    },
    category: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    commissionRate: {
        type: sequelize_1.DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            min: 0,
        },
    },
    commissionType: {
        type: sequelize_1.DataTypes.ENUM('percentage', 'fixed'),
        defaultValue: 'percentage',
    },
    active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        defaultValue: true,
    },
    salesCount: {
        type: sequelize_1.DataTypes.INTEGER,
        defaultValue: 0,
    },
    affiliateLink: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    sourcePlatform: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
}, {
    tableName: 'products',
    timestamps: true,
});
exports.default = Product;
