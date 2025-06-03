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
exports.initDatabase = exports.Earnings = exports.PromotionClick = exports.ProductView = exports.SocialMediaAccount = exports.SocialMediaPost = exports.Promotion = exports.Product = exports.User = exports.sequelize = void 0;
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
const productView_model_1 = __importDefault(require("./productView.model"));
exports.ProductView = productView_model_1.default;
const promotionClick_model_1 = __importDefault(require("./promotionClick.model"));
exports.PromotionClick = promotionClick_model_1.default;
const earnings_model_1 = __importDefault(require("./earnings.model"));
exports.Earnings = earnings_model_1.default;
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
// Product view associations
product_model_1.default.hasMany(productView_model_1.default, {
    foreignKey: 'productId',
    as: 'views',
    onDelete: 'CASCADE'
});
productView_model_1.default.belongsTo(product_model_1.default, { foreignKey: 'productId', as: 'product' });
user_model_1.default.hasMany(productView_model_1.default, {
    foreignKey: 'userId',
    as: 'productViews',
    onDelete: 'SET NULL' // Keep view records even if user is deleted
});
productView_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'userId', as: 'viewer' });
// Promotion click associations
promotion_model_1.default.hasMany(promotionClick_model_1.default, {
    foreignKey: 'promotionId',
    as: 'promotionClicks',
    onDelete: 'CASCADE'
});
promotionClick_model_1.default.belongsTo(promotion_model_1.default, { foreignKey: 'promotionId', as: 'promotion' });
user_model_1.default.hasMany(promotionClick_model_1.default, {
    foreignKey: 'userId',
    as: 'promotionClicks',
    onDelete: 'SET NULL' // Keep click records even if user is deleted
});
promotionClick_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'userId', as: 'clickUser' });
// Earnings associations
user_model_1.default.hasMany(earnings_model_1.default, {
    foreignKey: 'userId',
    as: 'earnings',
    onDelete: 'CASCADE'
});
earnings_model_1.default.belongsTo(user_model_1.default, { foreignKey: 'userId', as: 'earningUser' });
promotion_model_1.default.hasMany(earnings_model_1.default, {
    foreignKey: 'promotionId',
    as: 'earningsRecords',
    onDelete: 'CASCADE'
});
earnings_model_1.default.belongsTo(promotion_model_1.default, { foreignKey: 'promotionId', as: 'promotion' });
// Initialize database
const initDatabase = async () => {
    try {
        // Test the database connection
        await database_1.default.authenticate();
        console.log('✅ Database connection established successfully');
        // Create enum types if they don't exist
        await database_1.default.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'business', 'promoter');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
        await database_1.default.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."enum_earnings_type" AS ENUM('commission', 'bonus', 'refund');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
        await database_1.default.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."enum_earnings_status" AS ENUM('pending', 'paid', 'cancelled');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
        // Sync tables in correct order - first create the tables without any foreign key constraints
        const syncOptions = { force: false, alter: true };
        console.log('🔄 Starting database model synchronization...');
        // Step 1: Sync base models first (ones with no dependencies)
        console.log('Creating base tables...');
        await user_model_1.default.sync(syncOptions);
        console.log('✅ Users table synchronized');
        // Step 2: Sync models that depend on Users
        await product_model_1.default.sync(syncOptions);
        console.log('✅ Products table synchronized');
        await socialMediaAccount_model_1.default.sync(syncOptions);
        console.log('✅ SocialMediaAccounts table synchronized');
        // Step 3: Sync models that depend on Users and Products
        await promotion_model_1.default.sync(syncOptions);
        console.log('✅ Promotions table synchronized');
        // Step 4: Sync models that depend on Users and Promotions
        await earnings_model_1.default.sync(syncOptions);
        console.log('✅ Earnings table synchronized');
        // Step 5: Sync remaining models
        await productView_model_1.default.sync(syncOptions);
        console.log('✅ ProductViews table synchronized');
        await promotionClick_model_1.default.sync(syncOptions);
        console.log('✅ PromotionClicks table synchronized');
        console.log('✅ All database models synchronized successfully');
    }
    catch (error) {
        console.error('❌ Failed to initialize database:', error);
        throw error;
    }
};
exports.initDatabase = initDatabase;
