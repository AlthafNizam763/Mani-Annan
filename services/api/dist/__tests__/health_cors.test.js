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
    it('verifies CORS permits vercel preview deployments (*.vercel.app)', async () => {
        const res = await (0, supertest_1.default)(app)
            .options('/api/v1/me')
            .set('Origin', 'https://mani-annan-git-feat-preview.vercel.app')
            .set('Access-Control-Request-Method', 'POST')
            .set('Access-Control-Request-Headers', 'authorization,content-type');
        expect(res.status).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe('https://mani-annan-git-feat-preview.vercel.app');
    });
    it('verifies Cross-Origin-Resource-Policy is set to cross-origin', async () => {
        const res = await (0, supertest_1.default)(app).get('/health');
        expect(res.headers['cross-origin-resource-policy']).toBe('cross-origin');
    });
    it('verifies CORS preflight OPTIONS on WhatsApp connect endpoint', async () => {
        const res = await (0, supertest_1.default)(app)
            .options('/api/v1/integrations/whatsapp/session/connect')
            .set('Origin', 'https://mani-annan.vercel.app')
            .set('Access-Control-Request-Method', 'POST')
            .set('Access-Control-Request-Headers', 'authorization,content-type');
        expect(res.status).toBe(204);
        expect(res.headers['access-control-allow-origin']).toBe('https://mani-annan.vercel.app');
    });
    it('returns 401 with CORS headers when calling /api/v1/me without auth token', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/api/v1/me')
            .set('Origin', 'https://mani-annan.vercel.app');
        expect(res.status).toBe(401);
        expect(res.headers['access-control-allow-origin']).toBe('https://mani-annan.vercel.app');
        expect(res.body.error).toBe('Unauthorized');
    });
    it('confirms /me requires /api/v1 prefix (root /me returns 404)', async () => {
        const res = await (0, supertest_1.default)(app)
            .get('/me')
            .set('Origin', 'https://mani-annan.vercel.app');
        expect(res.status).toBe(404);
    });
    it('returns 404 for unknown routes without crashing', async () => {
        const res = await (0, supertest_1.default)(app).get('/non-existent-endpoint');
        expect(res.status).toBe(404);
    });
});
describe('Frontend API Base URL Normalization Rules & Production Safe Guard', () => {
    const PRODUCTION_API_URL = 'https://mani-annan.onrender.com/api/v1';
    const LOCAL_DEV_API_URL = 'http://localhost:8001/api/v1';
    function isLocalAddress(urlOrHost) {
        if (!urlOrHost)
            return false;
        return /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)(:\d+)?(\/.*)?$/i.test(urlOrHost.trim());
    }
    function getEffectiveApiBase(rawBase, mockHostname) {
        const trimmed = rawBase?.trim();
        let hostname = null;
        if (mockHostname) {
            hostname = mockHostname;
        }
        else if (typeof window !== 'undefined' && window.location) {
            hostname = window.location.hostname;
        }
        if (hostname) {
            const isLocalBrowser = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
            if (!isLocalBrowser) {
                if (trimmed && isLocalAddress(trimmed)) {
                    return PRODUCTION_API_URL;
                }
                if (trimmed && trimmed.length > 0) {
                    return trimmed;
                }
                return PRODUCTION_API_URL;
            }
            if (trimmed && trimmed.length > 0) {
                return trimmed;
            }
            return LOCAL_DEV_API_URL;
        }
        if (process.env.NODE_ENV === 'production') {
            if (trimmed && isLocalAddress(trimmed)) {
                return PRODUCTION_API_URL;
            }
            if (trimmed && trimmed.length > 0) {
                return trimmed;
            }
            return PRODUCTION_API_URL;
        }
        if (trimmed && trimmed.length > 0) {
            return trimmed;
        }
        return LOCAL_DEV_API_URL;
    }
    function resolveApiUrl(rawBase, path, mockHostname) {
        const effectiveBase = getEffectiveApiBase(rawBase, mockHostname);
        const base = effectiveBase.replace(/\/+$/, '');
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
    it('strictly rejects accidental localhost base URL when hosted on Vercel production', () => {
        const url = resolveApiUrl('http://localhost:8001/api/v1', '/me', 'mani-annan.vercel.app');
        expect(url).toBe('https://mani-annan.onrender.com/api/v1/me');
    });
    it('strictly rejects 127.0.0.1 base URL when hosted on Vercel preview domain', () => {
        const url = resolveApiUrl('http://127.0.0.1:8001', '/integrations/whatsapp/session/connect', 'mani-annan-preview.vercel.app');
        expect(url).toBe('https://mani-annan.onrender.com/api/v1/integrations/whatsapp/session/connect');
    });
    it('safely falls back to production Render backend when hosted on Vercel and env var is not set', () => {
        const url = resolveApiUrl(undefined, '/me', 'mani-annan.vercel.app');
        expect(url).toBe('https://mani-annan.onrender.com/api/v1/me');
    });
    it('uses localhost fallback for local development when env var is not set', () => {
        const url = resolveApiUrl(undefined, '/me', 'localhost');
        expect(url).toBe('http://localhost:8001/api/v1/me');
    });
    it('allows intentional localhost base URL during local development', () => {
        const url = resolveApiUrl('http://localhost:8001/api/v1', '/me', 'localhost');
        expect(url).toBe('http://localhost:8001/api/v1/me');
    });
});
