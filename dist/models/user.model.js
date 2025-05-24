"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = __importDefault(require("../config/database"));
// Create User model
const User = database_1.default.define('User', {
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    firstName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 50],
        },
    },
    lastName: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: [2, 50],
        },
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true, // Allow null for social login users
        validate: {
            len: [6, 100],
        },
    },
    phone: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    company: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
    },
    website: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: true,
        },
    },
    bio: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: true,
    },
    profilePicture: {
        type: sequelize_1.DataTypes.STRING,
        defaultValue: '',
    },
    googleId: {
        type: sequelize_1.DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    facebookId: {
        type: sequelize_1.DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    twitterId: {
        type: sequelize_1.DataTypes.STRING,
        unique: true,
        allowNull: true,
    },
    role: {
        type: sequelize_1.DataTypes.ENUM('admin', 'business', 'promoter'),
        allowNull: false,
        defaultValue: 'business',
        validate: {
            isIn: [['admin', 'business', 'promoter']]
        }
    },
    active: {
        type: sequelize_1.DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    },
}, {
    tableName: 'users',
    timestamps: true,
    hooks: {
        // Hash password before saving
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcryptjs_1.default.genSalt(10);
                user.password = await bcryptjs_1.default.hash(user.password, salt);
            }
        },
        // Hash password when updating if changed
        beforeUpdate: async (user) => {
            if (user.changed('password') && user.password) {
                const salt = await bcryptjs_1.default.genSalt(10);
                user.password = await bcryptjs_1.default.hash(user.password, salt);
            }
        },
    },
});
// Add instance method for comparing password
User.prototype.comparePassword = async function (candidatePassword) {
    if (!this.password)
        return false;
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
exports.default = User;
