import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Product attributes interface
interface ProductAttributes {
  id: number;
  name: string;
  description: string;
  price: number;
  images: string[];
  ownerId: number;
  category: string;
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
  active: boolean;
  salesCount: number;
  affiliateLink?: string;
  sourcePlatform?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Product creation attributes interface
interface ProductCreationAttributes extends Optional<ProductAttributes, 'id' | 'salesCount'> {}

// Product instance interface
interface ProductInstance
  extends Model<ProductAttributes, ProductCreationAttributes>,
    ProductAttributes {}

// Create Product model
const Product = sequelize.define<ProductInstance>(
  'Product',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [3, 100],
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    commissionRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0,
      },
    },
    commissionType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      defaultValue: 'percentage',
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    salesCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    affiliateLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sourcePlatform: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: 'products',
    timestamps: true,
  }
);

export { ProductAttributes, ProductInstance };
export default Product;