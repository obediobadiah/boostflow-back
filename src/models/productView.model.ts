import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// ProductView attributes interface
interface ProductViewAttributes {
  id: number;
  productId: number;
  userId?: number; // Optional, as anonymous views may not have a user
  timestamp: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// ProductView creation attributes interface
interface ProductViewCreationAttributes extends Optional<ProductViewAttributes, 'id'> {}

// ProductView instance interface
interface ProductViewInstance
  extends Model<ProductViewAttributes, ProductViewCreationAttributes>,
    ProductViewAttributes {}

// Create ProductView model
const ProductView = sequelize.define<ProductViewInstance>(
  'ProductView',
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'products',
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
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'product_views',
    timestamps: true,
  }
);

export default ProductView;
export { ProductViewAttributes, ProductViewInstance }; 