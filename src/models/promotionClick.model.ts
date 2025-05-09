import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// PromotionClick attributes interface
interface PromotionClickAttributes {
  id: number;
  promotionId: number;
  userId?: number; // Optional, as anonymous clicks may not have a user
  isConversion: boolean;
  earnings: number;
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// PromotionClick creation attributes interface
interface PromotionClickCreationAttributes extends Optional<PromotionClickAttributes, 'id'> {}

// PromotionClick instance interface
interface PromotionClickInstance
  extends Model<PromotionClickAttributes, PromotionClickCreationAttributes>,
    PromotionClickAttributes {}

// Create PromotionClick model
const PromotionClick = sequelize.define<PromotionClickInstance>(
  'PromotionClick',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    promotionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'promotions',
        key: 'id',
      },
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    isConversion: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    earnings: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'promotion_clicks',
    timestamps: true,
  }
);

export default PromotionClick;
export { PromotionClickAttributes, PromotionClickInstance }; 