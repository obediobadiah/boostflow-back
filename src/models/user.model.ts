import { Model, DataTypes, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/database';

// User attributes interface
interface UserAttributes {
  id: number;
  name: string;
  email: string;
  password: string;
  profilePicture?: string;
  googleId?: string;
  facebookId?: string;
  twitterId?: string;
  role?: string;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// User creation attributes interface (optional id for creation)
interface UserCreationAttributes extends Optional<UserAttributes, 'id' | 'password'> {}

// User instance methods interface
interface UserInstance extends Model<UserAttributes, UserCreationAttributes>, UserAttributes {
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Create User model
const User = sequelize.define<UserInstance>(
  'User',
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
        len: [2, 50],
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true, // Allow null for social login users
      validate: {
        len: [6, 100],
      },
    },
    profilePicture: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    googleId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    facebookId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    twitterId: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'business',
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    hooks: {
      // Hash password before saving
      beforeCreate: async (user: any) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      // Hash password when updating if changed
      beforeUpdate: async (user: any) => {
        if (user.changed('password') && user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Add instance method for comparing password
(User as any).prototype.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export { UserAttributes, UserInstance };
export default User; 