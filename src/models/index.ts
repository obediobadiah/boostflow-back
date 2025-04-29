import sequelize from '../config/database';
import User from './user.model';
import Product from './product.model';
import Promotion, { SocialMediaPost } from './promotion.model';
import SocialMediaAccount from './socialMediaAccount.model';

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

// Export models
export {
  sequelize,
  User,
  Product,
  Promotion,
  SocialMediaPost,
  SocialMediaAccount
};

// Export database initialization function
export const initDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // In development mode, sync models with database (create tables if they don't exist)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database models synchronized');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
}; 