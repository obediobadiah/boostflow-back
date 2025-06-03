import { Sequelize, Options, Dialect } from 'sequelize';
import dotenv from 'dotenv';
import pg from 'pg'; // Import pg module directly

// Load environment variables from .env
dotenv.config();

// Destructure environment variables
const {
  DATABASE_URL,
  POSTGRES_URL,
  DB_NAME = 'boostflow',
  DB_USER = 'obediobadiah',
  DB_PASSWORD = '',
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  NODE_ENV = 'development'
} = process.env;

const isProduction = NODE_ENV === 'production';

// Shared Sequelize options
const commonSequelizeOptions: Options = {
  dialect: 'postgres' as Dialect,
  dialectModule: pg,
  logging: NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  ...(isProduction ? {
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }
  } : {
    dialectOptions: {
      ssl: false
    }
  })
};

// Sequelize instance
let sequelize: Sequelize;

if (DATABASE_URL || POSTGRES_URL) {
  const connectionString = DATABASE_URL || POSTGRES_URL;
  console.log('Using database connection string');
  sequelize = new Sequelize(connectionString as string, commonSequelizeOptions);
} else {
  console.log('Using traditional database configuration');
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    ...commonSequelizeOptions,
    host: DB_HOST,
    port: parseInt(DB_PORT, 10)
  });
}

// Function to test database connection
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection has been established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    throw error;
  }
};

// Function to initialize database and sync models
export const initializeDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database authenticated successfully.');

    if (!isProduction) {
      await sequelize.sync({ alter: false }); // adjust if needed
      console.log('✅ Models synced to database.');
    }
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
};

export default sequelize;
