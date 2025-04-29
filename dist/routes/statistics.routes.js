"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const statistics_controller_1 = require("../controllers/statistics.controller");
const router = express_1.default.Router();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Get dashboard statistics
router.get('/dashboard', statistics_controller_1.getDashboardStats);
// Get active promotions
router.get('/active-promotions', statistics_controller_1.getActivePromotions);
// Get platform statistics
router.get('/platforms', statistics_controller_1.getPlatformStatistics);
exports.default = router;
