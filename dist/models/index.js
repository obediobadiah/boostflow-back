"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = exports.SocialMediaAccount = exports.SocialMediaPost = exports.Promotion = exports.Product = exports.User = exports.sequelize = void 0;
const database_1 = __importDefault(require("../config/database"));
exports.sequelize = database_1.default;
const user_model_1 = __importDefault(require("./user.model"));
exports.User = user_model_1.default;
const product_model_1 = __importDefault(require("./product.model"));
exports.Product = product_model_1.default;
const promotion_model_1 = __importStar(require("./promotion.model"));
exports.Promotion = promotion_model_1.default;
Object.defineProperty(exports, "SocialMediaPost", { enumerable: true, get: function () { return promotion_model_1.SocialMediaPost; } });
const socialMediaAccount_model_1 = __importDefault(require("./socialMediaAccount.model"));
exports.SocialMediaAccount = socialMediaAccount_model_1.default;
// Define associations
user_model_1.default.hasMany(product_model_1.default, {
    foreignKey: 'ownerId',
    as: 'ownedProducts',
    onDelete: 'CASCADE'
});
product_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'ownerId', as: 'owner' });
user_model_1.default.hasMany(promotion_model_1.default, {
    foreignKey: 'promoterId',
    as: 'promotions',
    onDelete: 'CASCADE'
});
promotion_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'promoterId', as: 'promoter' });
product_model_1.default.hasMany(promotion_model_1.default, {
    foreignKey: 'productId',
    as: 'promotions',
    onDelete: 'CASCADE'
});
promotion_model_1.default.belongsTo(product_model_1.default, { foreignKey: 'productId', as: 'product' });
user_model_1.default.hasMany(socialMediaAccount_model_1.default, {
    foreignKey: 'userId',
    as: 'socialMediaAccounts',
    onDelete: 'CASCADE'
});
socialMediaAccount_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'userId', as: 'user' });
// Export database initialization function
const initDatabase = async () => {
    try {
        await database_1.default.authenticate();
        console.log('Database connection established successfully');
        // In development mode, sync models with database (create tables if they don't exist)
        if (process.env.NODE_ENV === 'development') {
            await database_1.default.sync({ alter: true });
            console.log('Database models synchronized');
        }
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.initDatabase = initDatabase;
