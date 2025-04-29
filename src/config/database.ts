import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Extract database configuration from environment variables
const {
  DB_NAME = 'boostflow',
  DB_USER = 'obediobadiah',
  DB_PASSWORD = '',
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  NODE_ENV = 'development'
} = process.env;

// Create Sequelize instance
const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: parseInt(DB_PORT, 10),
  dialect: 'postgres',
  logging: NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    // Try to connect without a password using peer authentication 
    // if password is empty (common on local development setups)
    ...(DB_PASSWORD === '' ? { ssl: false } : {})
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Function to test database connection
export const testConnection = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

export default sequelize; 