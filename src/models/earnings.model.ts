import { Model, DataTypes } from 'sequelize';
import sequelize from '../config/database';
import User from './user.model';
import Promotion from './promotion.model';

export interface EarningsAttributes {
  id?: number;
  userId: number;
  promotionId: number;
  amount: number;
  type: 'commission' | 'bonus' | 'referral';
  status: 'pending' | 'paid' | 'cancelled';
  paymentDate?: Date;
  description?: string;
  metadata?: {
    commissionType?: 'percentage' | 'fixed';
    commissionRate?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export class Earnings extends Model<EarningsAttributes> implements EarningsAttributes {
  public id!: number;
  public userId!: number;
  public promotionId!: number;
  public amount!: number;
  public type!: 'commission' | 'bonus' | 'referral';
  public status!: 'pending' | 'paid' | 'cancelled';
  public paymentDate?: Date;
  public description?: string;
  public metadata?: {
    commissionType?: 'percentage' | 'fixed';
    commissionRate?: number;
  };
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Earnings.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    promotionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Promotions',
        key: 'id',
      },
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('commission', 'bonus', 'referral'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'paid', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    paymentDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'earnings',
    timestamps: true,
  }
);

// Define relationships
Earnings.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

Earnings.belongsTo(Promotion, {
  foreignKey: 'promotionId',
  as: 'promotion',
});

export default Earnings; 