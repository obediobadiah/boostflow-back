"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const passport_1 = __importDefault(require("passport"));
require("./config/passport");
const error_middleware_1 = require("./middleware/error.middleware");
const models_1 = require("./models");
// Load environment variables
dotenv_1.default.config();
// Debug the sequelize instance
console.log('Sequelize instance type:', typeof models_1.sequelize);
console.log('Is Sequelize instance:', models_1.sequelize instanceof Object);
console.log('Has define method:', typeof models_1.sequelize.define === 'function');
// Import routes
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const promotion_routes_1 = __importDefault(require("./routes/promotion.routes"));
const socialMedia_routes_1 = __importDefault(require("./routes/socialMedia.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
// Create Express app
const app = (0, express_1.default)();
// Set up middleware
app.use((0, helmet_1.default)());
// Configure CORS to allow requests from frontend
app.use((0, cors_1.default)({
    origin: '*', // Allow requests from any origin for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(express_1.default.json({ limit: '50mb' })); // Increase limit for large images
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
app.use((0, morgan_1.default)('dev'));
app.use(passport_1.default.initialize());
// Initialize database connection
const setupDatabase = async () => {
    try {
        await (0, models_1.initDatabase)();
    }
    catch (error) {
        console.error('Database initialization error:', error);
        process.exit(1);
    }
};
// Initialize database
setupDatabase();
// Set up routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/promotions', promotion_routes_1.default);
app.use('/api/social-media', socialMedia_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to BoostFlow API',
        version: '1.0.0',
    });
});
// 404 handler
app.use(error_middleware_1.notFound);
// Error handling middleware
app.use(error_middleware_1.errorHandler);
// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, async () => {
    // Initialize database connection
    try {
        await (0, models_1.initDatabase)();
    }
    catch (error) {
        console.error('Database initialization failed:', error);
    }
});
