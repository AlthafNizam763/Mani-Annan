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
const config_1 = require("./config");
const createApp = () => {
    const app = (0, express_1.default)();
    // Basic security and parsing middlewares
    app.use((0, helmet_1.default)({
        crossOriginResourcePolicy: { policy: 'cross-origin' }
    }));
    // CORS configuration
    const configuredOrigins = config_1.config.cors.origin
        ? config_1.config.cors.origin.split(',').map(o => o.trim()).filter(Boolean)
        : [];
    const isOriginAllowed = (origin) => {
        // If specific origins configured via CORS_ORIGIN
        if (configuredOrigins.length > 0) {
            if (configuredOrigins.includes(origin) || configuredOrigins.includes('*'))
                return true;
        }
        // Always permit the production frontend and vercel preview domains
        if (origin === 'https://mani-annan.vercel.app')
            return true;
        if (origin.endsWith('.vercel.app'))
            return true;
        // Always permit local development
        if (origin === 'http://localhost:3000' ||
            origin === 'http://localhost:3001' ||
            origin === 'http://127.0.0.1:3000')
            return true;
        // If no specific CORS_ORIGIN was provided, allow by default
        if (configuredOrigins.length === 0)
            return true;
        return false;
    };
    const corsOptions = {
        origin: (origin, callback) => {
            // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
            if (!origin)
                return callback(null, true);
            if (isOriginAllowed(origin)) {
                return callback(null, true);
            }
            return callback(null, false);
        },
        credentials: true,
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With', 'Origin'],
        maxAge: 86400
    };
    app.use((0, cors_1.default)(corsOptions));
    app.options('*', (0, cors_1.default)(corsOptions));
    app.use(express_1.default.json({ limit: '10mb' })); // Support chat file uploads up to 10MB
    if (process.env.NODE_ENV !== 'test') {
        app.use((0, morgan_1.default)('dev'));
    }
    // Global rate limiter
    app.use(rateLimit_1.apiLimiter);
    // Root status route
    app.get('/', (_req, res) => {
        res.json({
            service: 'mani-annan-api',
            status: 'online',
            version: '1.0.0',
            endpoints: {
                health: '/health',
                apiV1: '/api/v1'
            }
        });
    });
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
