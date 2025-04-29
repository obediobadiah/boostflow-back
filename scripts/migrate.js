const { execSync } = require('child_process');
const path = require('path');

// Set the NODE_ENV to development by default
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

console.log(`Running migrations in ${process.env.NODE_ENV} environment`);

try {
  // Run the migrations using Sequelize CLI
  execSync('npx sequelize-cli db:migrate', {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit'
  });
  
  console.log('Migrations completed successfully');
} catch (error) {
  console.error('Error running migrations:', error.message);
  process.exit(1);
} 