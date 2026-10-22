"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const firebase_1 = require("../firebase");
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Missing or malformed Authorization header with Bearer token'
        });
        return;
    }
    const token = authHeader.split('Bearer ')[1].trim();
    // Support local test mock token ONLY in explicit automated test environments
    if (process.env.NODE_ENV === 'test' &&
        process.env.ALLOW_TEST_MOCK_TOKENS === 'true' &&
        token.startsWith('mock_test_token_')) {
        const testUid = token.replace('mock_test_token_', '');
        req.user = {
            uid: testUid,
            email: `${testUid}@example.com`
        };
        next();
        return;
    }
    try {
        const decoded = await firebase_1.auth.verifyIdToken(token);
        req.user = {
            uid: decoded.uid,
            email: decoded.email
        };
        next();
    }
    catch (err) {
        res.status(401).json({
            error: 'Unauthorized',
            message: 'Invalid or expired Firebase ID token',
            details: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
};
exports.authenticateToken = authenticateToken;
