import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Define the supported social media platforms
type PlatformType = 'facebook' | 'instagram' | 'twitter' | 'tiktok' | 'youtube' | 'linkedin' | 'pinterest' | 'other';

// SocialMediaAccount attributes interface
interface SocialMediaAccountAttributes {
  id: number;
  userId: number;
  platform: PlatformType;
  username: string;
  accountId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiry?: Date;
  isConnected: boolean;
  connectionDate?: Date;
  lastPostDate?: Date;
  followerCount?: number;
  metadata?: object;
  createdAt?: Date;
  updatedAt?: Date;
}

// SocialMediaAccount creation attributes interface
interface SocialMediaAccountCreationAttributes
  extends Optional<SocialMediaAccountAttributes, 'id' | 'isConnected' | 'followerCount' | 'metadata'> {}

// SocialMediaAccount instance interface
interface SocialMediaAccountInstance
  extends Model<SocialMediaAccountAttributes, SocialMediaAccountCreationAttributes>,
    SocialMediaAccountAttributes {}

// Create SocialMediaAccount model
const SocialMediaAccount = sequelize.define<SocialMediaAccountInstance>(
  'SocialMediaAccount',
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
        model: 'users',
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
    username: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accountId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    accessToken: {
      type: DataTypes.TEXT,
    },
    refreshToken: {
      type: DataTypes.TEXT,
    },
    tokenExpiry: {
      type: DataTypes.DATE,
    },
    isConnected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    connectionDate: {
      type: DataTypes.DATE,
    },
    lastPostDate: {
      type: DataTypes.DATE,
    },
    followerCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
    },
  },
  {
    tableName: 'social_media_accounts',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId', 'platform'],
      },
    ],
  }
);

export { SocialMediaAccountAttributes, SocialMediaAccountInstance, PlatformType };
export default SocialMediaAccount; 