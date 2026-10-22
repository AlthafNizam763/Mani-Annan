"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../app");
describe('Server Status, Health & CORS Verification', () => {
    const app = (0, app_1.createApp)();
    it('GET / returns 200 and root server information', async () => {
        const res = await (0, supertest_1.default)(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body.service).toBe('mani-annan-api');
        expect(res.body.status).toBe('online');
        expect(res.body.endpoints.health).toBe('/health');
        expect(res.body.endpoints.apiV1).toBe('/api/v1');
    });
    it('GET /health returns 200 ok', async () => {
        const res = await (0, supertest_1.default)(app).get('/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.service).toBe('mani-annan-api');
        expect(res.body.timestamp).toBeDefined();
    });
    it('GET /api/v1 returns 200 and lists api endpoints', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
        expect(res.body.version).toBe('v1');
        expect(res.body.endpoints).toContain('/api/v1/me');
        expect(res.body.endpoints).toContain('/api/v1/contacts');
    });
    it('GET /api/v1/health returns 200 ok', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/health');
        expect(res.status).toBe(200);
        expect(res.body.status).toBe('ok');
    });
    it('verifies CORS preflight OPTIONS permits https://mani-annan.vercel.app', async () => {
        const res = await (0, supertest_1.default)(app)
            .options('/api/v1/me')
            .set('Origin', 'https://mani-annan.vercel.app')
            .set('Access-Control-Request-Method', 'GET')
            .set('Access-Control-Request-Headers', 'authorization,content-type');
        expect(res.status).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe('https://mani-annan.vercel.app');
        expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
    it('verifies Cross-Origin-Resource-Policy is set to cross-origin', async () => {
        const res = await (0, supertest_1.default)(app).get('/health');
        expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    });
    it('returns 404 for unknown routes without crashing', async () => {
        const res = await (0, supertest_1.default)(app).get('/non-existent-endpoint');
        expect(res.status).toBe(404);
    });
});
describe('Frontend API Base URL Normalization Rules', () => {
    // Test the exact normalization algorithm implemented in apps/web/src/lib/api.ts
    function resolveApiUrl(rawBase, path) {
        const base = (rawBase || 'http://localhost:8001/api/v1').trim().replace(/\/+$/, '');
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        if (base.endsWith('/api/v1')) {
            if (cleanPath === '/api/v1') {
                return base;
            }
            if (cleanPath.startsWith('/api/v1/')) {
                return `${base}${cleanPath.slice(7)}`;
            }
            return `${base}${cleanPath}`;
        }
        if (cleanPath.startsWith('/api/v1')) {
            return `${base}${cleanPath}`;
        }
        return `${base}/api/v1${cleanPath}`;
    }
    it('normalizes base URL when /api/v1 is already present', () => {
        const url = resolveApiUrl('https://mani-annan.onrender.com/api/v1', '/me');
        expect(url).toBe('https://mani-annan.onrender.com/api/v1/me');
    });
    it('automatically adds /api/v1 when omitted from NEXT_PUBLIC_API_URL', () => {
        const url = resolveApiUrl('https://mani-annan.onrender.com', '/me');
        expect(url).toBe('https://mani-annan.onrender.com/api/v1/me');
    });
    it('handles trailing slash on base URL without producing double slashes', () => {
        const url = resolveApiUrl('https://mani-annan.onrender.com/api/v1/', '/contacts');
        expect(url).toBe('https://mani-annan.onrender.com/api/v1/contacts');
    });
    it('prevents duplication if caller path already includes /api/v1', () => {
        const url = resolveApiUrl('https://mani-annan.onrender.com/api/v1', '/api/v1/drafts');
        expect(url).toBe('https://mani-annan.onrender.com/api/v1/drafts');
    });
    it('uses default localhost fallback when env var is undefined', () => {
        const url = resolveApiUrl(undefined, '/me');
        expect(url).toBe('http://localhost:8001/api/v1/me');
    });
});
