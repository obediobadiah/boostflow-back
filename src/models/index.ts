import sequelize from '../config/database';
import User from './user.model';
import Product from './product.model';
import Promotion, { SocialMediaPost } from './promotion.model';
import SocialMediaAccount from './socialMediaAccount.model';
import ProductView from './productView.model';
import PromotionClick from './promotionClick.model';

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
ProductView.belongsTo(User, { foreignKey: 'userId', as: 'user' });

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
PromotionClick.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Export models
export {
  sequelize,
  User,
  Product,
  Promotion,
  SocialMediaPost,
  SocialMediaAccount,
  ProductView,
  PromotionClick
};

// Initialize database
export const initDatabase = async () => {
  try {
    // Test the database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Sync models with database - avoid altering tables to prevent constraint issues
    await sequelize.sync({ alter: false, force: false });
    console.log('Database models synchronized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}; 