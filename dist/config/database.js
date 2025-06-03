"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = exports.testConnection = void 0;
const sequelize_1 = require("sequelize");
const dotenv_1 = __importDefault(require("dotenv"));
const pg_1 = __importDefault(require("pg")); // Import pg module directly
// Load environment variables from .env
dotenv_1.default.config();
// Destructure environment variables
const { DATABASE_URL, POSTGRES_URL, DB_NAME = 'boostflow', DB_USER = 'obediobadiah', DB_PASSWORD = '', DB_HOST = 'localhost', DB_PORT = '5432', NODE_ENV = 'development' } = process.env;
const isProduction = NODE_ENV === 'production';
// Shared Sequelize options
const commonSequelizeOptions = {
    dialect: 'postgres',
    dialectModule: pg_1.default,
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
let sequelize;
if (DATABASE_URL || POSTGRES_URL) {
    const connectionString = DATABASE_URL || POSTGRES_URL;
    console.log('Using database connection string');
    sequelize = new sequelize_1.Sequelize(connectionString, commonSequelizeOptions);
}
else {
    console.log('Using traditional database configuration');
    sequelize = new sequelize_1.Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
        ...commonSequelizeOptions,
        host: DB_HOST,
        port: parseInt(DB_PORT, 10)
    });
}
// Function to test database connection
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database connection has been established successfully.');
    }
    catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        throw error;
    }
};
exports.testConnection = testConnection;
// Function to initialize database and sync models
const initializeDatabase = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Database authenticated successfully.');
        if (!isProduction) {
            await sequelize.sync({ alter: false }); // adjust if needed
            console.log('✅ Models synced to database.');
        }
    }
    catch (error) {
        console.error('❌ Failed to initialize database:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
exports.default = sequelize;
