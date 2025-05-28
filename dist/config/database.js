"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.testConnection = void 0;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Extract database configuration from environment variables
const { DB_NAME = 'boostflow', DB_USER = 'obediobadiah', DB_PASSWORD = '', DB_HOST = 'localhost', DB_PORT = '5432', NODE_ENV = 'development' } = process.env;
// Create Sequelize instance
const sequelize = new sequelize_1.Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
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
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.testConnection = testConnection;
// Initialize the database connection
const initializeDatabase = async () => {
    try {
        await sequelize.authenticate();
        // Database connection has been established successfully
        // Sync models with database
        if (process.env.NODE_ENV !== 'production') {
            await sequelize.sync({ alter: false }); // Set alter to false to avoid constraint issues
        }
    }
    catch (error) {
        console.error('Unable to connect to the database:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
// Export the sequelize instance directly
exports.default = sequelize;
