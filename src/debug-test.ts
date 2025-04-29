import dotenv from 'dotenv';
import { sequelize, Product, User } from './models';

// Load environment variables
dotenv.config();

async function testConnection() {
  console.log('Starting database connection test...');
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');

    // Check for existing users
    const user = await User.findOne();
    
    if (!user) {
      console.log('No users found, creating a test user');
      // Create a test user
      const newUser = await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'business'
      });
      console.log(`Test user created with ID: ${newUser.id}`);
    } else {
      console.log(`Found existing user with ID: ${user.id}`);
    }

    // Create a test product
    console.log('Creating a test product...');
    const product = await Product.create({
      name: 'Test Product',
      description: 'This is a test product created for debugging',
      price: 29.99,
      images: ['https://via.placeholder.com/300'],
      ownerId: user ? user.id : 1,
      category: 'digital',
      commissionRate: 10,
      commissionType: 'percentage',
      active: true
    });

    console.log('Test product created successfully!');
    console.log('Product details:', { 
      id: product.id, 
      name: product.name, 
      price: product.price,
      category: product.category
    });

    // Verify we can retrieve the product
    const retrievedProduct = await Product.findByPk(product.id);
    console.log('Retrieved product:', retrievedProduct ? 'Yes' : 'No');

    console.log('All tests passed successfully!');
  } catch (error) {
    console.error('Database test failed:', error);
  } finally {
    // Close the connection
    process.exit(0);
  }
}

// Run the test
testConnection(); 