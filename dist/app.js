"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const passport_1 = __importDefault(require("passport"));
const error_middleware_1 = require("./middleware/error.middleware");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const promotion_routes_1 = __importDefault(require("./routes/promotion.routes"));
const earnings_routes_1 = __importDefault(require("./routes/earnings.routes"));
const socialMedia_routes_1 = __importDefault(require("./routes/socialMedia.routes"));
const dashboard_routes_1 = __importDefault(require("./routes/dashboard.routes"));
require("./config/passport");
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(passport_1.default.initialize());
// Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/promotions', promotion_routes_1.default);
app.use('/api/earnings', earnings_routes_1.default);
app.use('/api/social-media', socialMedia_routes_1.default);
app.use('/api/dashboard', dashboard_routes_1.default);
// Error handling
app.use(error_middleware_1.notFound);
app.use(error_middleware_1.errorHandler);
exports.default = app;
