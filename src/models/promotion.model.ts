import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Social media post attributes interface
interface SocialMediaPostAttributes {
  id: number;
  promotionId: number;
  platform: string;
  postUrl: string;
  postId: string;
  postDate: Date;
  content?: string;
  images?: string[];
  clicks: number;
  conversions: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Promotion attributes interface
interface PromotionAttributes {
  id: number;
  productId: number;
  promoterId: number;
  trackingCode: string;
  commissionRate: number;
  commissionType: 'percentage' | 'fixed';
  status: 'active' | 'inactive' | 'banned';
  clicks: number;
  conversions: number;
  earnings: number;
  affiliateLink: string;
  description?: string;
  customImages?: string[];
  autoPostToSocial: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// Promotion creation attributes interface
interface PromotionCreationAttributes
  extends Optional<PromotionAttributes, 'id' | 'clicks' | 'conversions' | 'earnings' | 'customImages' | 'description' | 'autoPostToSocial'> {}

// Promotion instance interface
interface PromotionInstance
  extends Model<PromotionAttributes, PromotionCreationAttributes>,
    PromotionAttributes {}

// Create Promotion model
const Promotion = sequelize.define<PromotionInstance>(
  'Promotion',
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
    promoterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    trackingCode: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    commissionRate: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    commissionType: {
      type: DataTypes.ENUM('percentage', 'fixed'),
      defaultValue: 'percentage',
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'banned'),
      defaultValue: 'active',
    },
    clicks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    conversions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    earnings: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0,
    },
    affiliateLink: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    customImages: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    autoPostToSocial: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    tableName: 'promotions',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['productId', 'promoterId'],
      },
    ],
  }
);

// Create SocialMediaPost model
const SocialMediaPost = sequelize.define<Model<SocialMediaPostAttributes>>(
  'SocialMediaPost',
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
    platform: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [['facebook', 'instagram', 'twitter', 'tiktok', 'youtube', 'linkedin', 'pinterest', 'other']],
      },
    },
    postUrl: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isUrl: true,
      },
    },
    postId: {
      type: DataTypes.STRING,
    },
    postDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    images: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    clicks: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    conversions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: 'social_media_posts',
    timestamps: true,
  }
);

// Define associations
Promotion.hasMany(SocialMediaPost, {
  foreignKey: 'promotionId',
  as: 'socialMediaPosts',
  onDelete: 'CASCADE',
});
SocialMediaPost.belongsTo(Promotion, { foreignKey: 'promotionId' });

export { PromotionAttributes, PromotionInstance, SocialMediaPostAttributes };
export { SocialMediaPost };
export default Promotion; 