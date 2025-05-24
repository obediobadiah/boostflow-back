const { Client } = require('pg');
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

async function createDatabase() {
  // Connect to default 'postgres' database to create our database
  const adminClient = new Client({
    user: DB_USER,
    password: DB_PASSWORD,
    host: DB_HOST,
    port: DB_PORT,
    database: 'postgres' // Default database
  });

  try {
    await adminClient.connect();
    console.log('Connected to PostgreSQL server');

    // Check if database exists
    const checkResult = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [DB_NAME]
    );

    if (checkResult.rowCount === 0) {
      // Database does not exist, create it
      console.log(`Creating database '${DB_NAME}'...`);
      await adminClient.query(`CREATE DATABASE ${DB_NAME}`);
      console.log(`Database '${DB_NAME}' created successfully`);
    } else {
      console.log(`Database '${DB_NAME}' already exists`);
    }

  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  } finally {
    try {
      await adminClient.end();
    } catch (e) {
      // Ignore closing errors
    }
  }
}

// Run the initialization
createDatabase()
  .then(() => {
    console.log('Database initialization completed');
    process.exit(0);
  })
  .catch(error => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }); 