import sequelize from '../config/database';
import User from './user.model';
import Product from './product.model';
import Promotion, { SocialMediaPost } from './promotion.model';
import SocialMediaAccount from './socialMediaAccount.model';
import ProductView from './productView.model';
import PromotionClick from './promotionClick.model';
import Earnings from './earnings.model';

// Define associations
User.hasMany(Product, {
  foreignKey: 'ownerId',
  as: 'ownedProducts',
  onDelete: 'CASCADE'
});
Product.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(Promotion, {
  foreignKey: 'promoterId',
  as: 'promotions',
  onDelete: 'CASCADE'
});
Promotion.belongsTo(User, { foreignKey: 'promoterId', as: 'promoter' });

Product.hasMany(Promotion, {
  foreignKey: 'productId',
  as: 'promotions',
  onDelete: 'CASCADE'
});
Promotion.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(SocialMediaAccount, {
  foreignKey: 'userId',
  as: 'socialMediaAccounts',
  onDelete: 'CASCADE'
});
SocialMediaAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Product view associations
Product.hasMany(ProductView, {
  foreignKey: 'productId',
  as: 'views',
  onDelete: 'CASCADE'
});
ProductView.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

User.hasMany(ProductView, {
  foreignKey: 'userId',
  as: 'productViews',
  onDelete: 'SET NULL'  // Keep view records even if user is deleted
});
ProductView.belongsTo(User, { foreignKey: 'userId', as: 'viewer' });

// Promotion click associations
Promotion.hasMany(PromotionClick, {
  foreignKey: 'promotionId',
  as: 'promotionClicks',
  onDelete: 'CASCADE'
});
PromotionClick.belongsTo(Promotion, { foreignKey: 'promotionId', as: 'promotion' });

User.hasMany(PromotionClick, {
  foreignKey: 'userId',
  as: 'promotionClicks',
  onDelete: 'SET NULL'  // Keep click records even if user is deleted
});
PromotionClick.belongsTo(User, { foreignKey: 'userId', as: 'clickUser' });

// Earnings associations
User.hasMany(Earnings, {
  foreignKey: 'userId',
  as: 'earnings',
  onDelete: 'CASCADE'
});
Earnings.belongsTo(User, { foreignKey: 'userId', as: 'earningUser' });

Promotion.hasMany(Earnings, {
  foreignKey: 'promotionId',
  as: 'earningsRecords',
  onDelete: 'CASCADE'
});
Earnings.belongsTo(Promotion, { foreignKey: 'promotionId', as: 'promotion' });

// Export models
export {
  sequelize,
  User,
  Product,
  Promotion,
  SocialMediaPost,
  SocialMediaAccount,
  ProductView,
  PromotionClick,
  Earnings
};

// Initialize database
export const initDatabase = async () => {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully');
    
    // Create enum types if they don't exist
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'business', 'promoter');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE "public"."enum_earnings_type" AS ENUM('commission', 'bonus', 'refund');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await sequelize.query(`
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
    await User.sync(syncOptions);
    console.log('✅ Users table synchronized');
    
    // Step 2: Sync models that depend on Users
    await Product.sync(syncOptions);
    console.log('✅ Products table synchronized');
    
    await SocialMediaAccount.sync(syncOptions);
    console.log('✅ SocialMediaAccounts table synchronized');
    
    // Step 3: Sync models that depend on Users and Products
    await Promotion.sync(syncOptions);
    console.log('✅ Promotions table synchronized');
    
    // Step 4: Sync models that depend on Users and Promotions
    await Earnings.sync(syncOptions);
    console.log('✅ Earnings table synchronized');
    
    // Step 5: Sync remaining models
    await ProductView.sync(syncOptions);
    console.log('✅ ProductViews table synchronized');
    
    await PromotionClick.sync(syncOptions);
    console.log('✅ PromotionClicks table synchronized');

    console.log('✅ All database models synchronized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}; 