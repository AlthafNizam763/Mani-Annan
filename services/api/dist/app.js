"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const rateLimit_1 = require("./middlewares/rateLimit");
const error_1 = require("./middlewares/error");
const routes_1 = require("./routes");
const createApp = () => {
    const app = (0, express_1.default)();
    // Basic security and parsing middlewares
    app.use((0, helmet_1.default)());
    app.use((0, cors_1.default)({ origin: true, credentials: true }));
    app.use(express_1.default.json({ limit: '10mb' })); // Support chat file uploads up to 10MB
    if (process.env.NODE_ENV !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    // Global rate limiter
    app.use(rateLimit_1.apiLimiter);
    // Health check
    app.get('/health', (_req, res) => {
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'mani-annan-api'
        });
    });
    // API v1 router
    app.use('/api/v1', routes_1.router);
    // Centralized error handling
    app.use(error_1.errorHandler);
    return app;
};
exports.createApp = createApp;
