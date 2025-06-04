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
require("./config/passport");
const models_1 = require("./models");
const app_1 = __importDefault(require("./app"));
// Load environment variables
dotenv_1.default.config();
// Configure additional middleware not included in app.ts
app_1.default.use((0, helmet_1.default)());
app_1.default.use((0, morgan_1.default)('dev'));
app_1.default.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['*'], // Allow requests from any origin for development
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app_1.default.use(express_1.default.json({ limit: '50mb' })); // Increase limit for large images
app_1.default.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Root route
app_1.default.get('/', (req, res) => {
    res.json({
        message: 'Welcome to BoostFlow API',
        version: '1.0.0',
    });
});
// Initialize database
(async () => {
    try {
        await (0, models_1.initDatabase)();
        console.log('Database initialized successfully');
    }
    catch (error) {
        console.error('Database initialization failed:', error);
    }
})();
// Start server if not being imported (for local development)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5001;
    app_1.default.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}
// Export the Express app for serverless environments
exports.default = app_1.default;
module.exports = app_1.default;
