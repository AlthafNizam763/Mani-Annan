"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = require("express");
const me_1 = require("./me");
const imports_1 = require("./imports");
const contacts_1 = require("./contacts");
const replies_1 = require("./replies");
const drafts_1 = require("./drafts");
const privacy_1 = require("./privacy");
const whatsapp_1 = require("./whatsapp");
exports.router = (0, express_1.Router)();
exports.router.get('/', (_req, res) => {
    res.json({
        status: 'ok',
        version: 'v1',
        service: 'mani-annan-api',
        endpoints: [
            '/api/v1/me',
            '/api/v1/contacts',
            '/api/v1/imports',
            '/api/v1/drafts',
            '/api/v1/replies',
            '/api/v1/privacy',
            '/api/v1/integrations/whatsapp'
        ]
    });
});
exports.router.get('/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'mani-annan-api'
    });
});
exports.router.use('/me', me_1.meRouter);
exports.router.use('/me', privacy_1.privacyRouter); // mounts /me/data
exports.router.use('/imports', imports_1.importsRouter);
exports.router.use('/contacts', contacts_1.contactsRouter);
exports.router.use('/replies', replies_1.repliesRouter);
exports.router.use('/drafts', drafts_1.draftsRouter);
exports.router.use('/privacy', privacy_1.privacyRouter);
exports.router.use('/integrations/whatsapp', whatsapp_1.whatsappRouter);
