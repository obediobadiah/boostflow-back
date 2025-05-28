import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import pg from 'pg'; // Import pg module directly

// Load environment variables
dotenv.config();

// Extract database configuration from environment variables
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

// Use DATABASE_URL if available (Neon serverless connection), otherwise use traditional config
let sequelize: Sequelize;

if (DATABASE_URL || POSTGRES_URL) {
  // Use the connection string provided by Vercel/Neon
  const connectionString = DATABASE_URL || POSTGRES_URL;
  console.log('Using database connection string');
  
  sequelize = new Sequelize(connectionString as string, {
    dialect: 'postgres',
    dialectModule: pg, // Explicitly provide the pg module to Sequelize
    logging: NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
} else {
  // Use traditional configuration for local development
  console.log('Using traditional database configuration');
  
  sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
    host: DB_HOST,
    port: parseInt(DB_PORT, 10),
    dialect: 'postgres',
    dialectModule: pg, // Explicitly provide the pg module to Sequelize
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
}

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

// Initialize the database connection
export const initializeDatabase = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    // Database connection has been established successfully
    
    // Sync models with database
    if (process.env.NODE_ENV !== 'production') {
      await sequelize.sync({ alter: false }); // Set alter to false to avoid constraint issues
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Export the sequelize instance directly
export default sequelize; 