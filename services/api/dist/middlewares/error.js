"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const zod_1 = require("zod");
const errorHandler = (err, _req, res, _next) => {
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            error: 'ValidationError',
            message: 'Invalid request payload',
            issues: err.errors.map(e => ({
                path: e.path.join('.'),
                message: e.message
            }))
        });
        return;
    }
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        error: err.name || 'InternalServerError',
        message,
        ...(process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? { stack: err.stack, details: err.message } : {})
    });
};
exports.errorHandler = errorHandler;
