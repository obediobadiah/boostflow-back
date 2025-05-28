const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Path to .env file
const envPath = path.resolve(__dirname, '../.env');

try {
  // Read the current .env file
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Check if DATABASE_URL already exists
  const hasDbUrl = envContent.includes('DATABASE_URL=');
  
  // Create the DATABASE_URL using existing DB variables
  const dbUrl = `DATABASE_URL="postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?schema=public"`;
  
  // Update or append the DATABASE_URL
  if (hasDbUrl) {
    // Replace existing DATABASE_URL line
    envContent = envContent.replace(/DATABASE_URL=.*(\r?\n|$)/g, `${dbUrl}\n`);
  } else {
    // Append DATABASE_URL to the end
    envContent += `\n\n# Prisma Database URL\n${dbUrl}\n`;
  }
  
  // Write the updated content back to .env
  fs.writeFileSync(envPath, envContent);
  
  console.log('✅ .env file updated successfully with Prisma configuration');
} catch (error) {
  console.error('❌ Error updating .env file:', error);
} 