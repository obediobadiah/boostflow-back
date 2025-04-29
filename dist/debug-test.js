"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const models_1 = require("./models");
// Load environment variables
dotenv_1.default.config();
async function testConnection() {
    console.log('Starting database connection test...');
    try {
        // Test database connection
        await models_1.sequelize.authenticate();
        console.log('Database connection established successfully');
        // Check for existing users
        const user = await models_1.User.findOne();
        if (!user) {
            console.log('No users found, creating a test user');
            // Create a test user
            const newUser = await models_1.User.create({
                name: 'Test User',
                email: 'test@example.com',
                password: 'password123',
                role: 'business'
            });
            console.log(`Test user created with ID: ${newUser.id}`);
        }
        else {
            console.log(`Found existing user with ID: ${user.id}`);
        }
        // Create a test product
        console.log('Creating a test product...');
        const product = await models_1.Product.create({
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
        const retrievedProduct = await models_1.Product.findByPk(product.id);
        console.log('Retrieved product:', retrievedProduct ? 'Yes' : 'No');
        console.log('All tests passed successfully!');
    }
    catch (error) {
        console.error('Database test failed:', error);
    }
    finally {
        // Close the connection
        process.exit(0);
    }
}
// Run the test
testConnection();
