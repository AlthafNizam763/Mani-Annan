"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generationLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Standard API rate limiter: 120 requests per minute
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'TooManyRequests',
        message: 'Rate limit exceeded. Please wait a moment before sending more requests.'
    }
});
// Stricter rate limiter for LLM generation: 20 calls per minute
exports.generationLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'TooManyRequests',
        message: 'Reply generation rate limit exceeded. Please wait before generating more drafts.'
    }
});
