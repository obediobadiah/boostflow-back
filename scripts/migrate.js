const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const {
  DB_NAME = 'boostflow',
  DB_USER = 'obediobadiah',
  DB_PASSWORD = '',
  DB_HOST = 'localhost',
  DB_PORT = '5432'
} = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: console.log
});

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database successfully');

    // Import all models
    require('../dist/models');

    // Sync all models with the database - only alter tables, never drop
    await sequelize.sync({ 
      alter: true,    // Alter tables to match models
      force: false    // Never force recreate tables
    });
    console.log('Database synchronized successfully');

  } catch (error) {
    console.error('Error running migrations:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migrations
runMigrations()
  .then(() => {
    console.log('Migrations completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Migrations failed:', error);
    process.exit(1);
  }); 