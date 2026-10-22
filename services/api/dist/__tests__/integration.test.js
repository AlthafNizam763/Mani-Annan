"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = require("../app");
process.env.ALLOW_TEST_MOCK_TOKENS = 'true';
describe('End-to-End API Security & Workflow Verification', () => {
    jest.setTimeout(30000);
    const app = (0, app_1.createApp)();
    const tokenA = 'Bearer mock_test_token_user_alpha';
    const tokenB = 'Bearer mock_test_token_user_beta';
    let createdContactId;
    let createdDraftId;
    it('verifies that unauthenticated requests fail with 401', async () => {
        const res = await (0, supertest_1.default)(app).get('/api/v1/me');
        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Unauthorized');
    });
    it('Step 1-5: Imports authorized chat, extracts owner messages, updates style profile', async () => {
        const syntheticChat = `
[10/14/26, 10:00:00] UserAlpha: Hey boss, sending the project estimate now
[10/14/26, 10:01:00] Manager: Received. Can we meet at 3pm?
[10/14/26, 10:02:00] UserAlpha: Sure, on for 3pm lah... Will prep the slides 👍
`;
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/imports')
            .set('Authorization', tokenA)
            .send({
            rawText: syntheticChat,
            ownerIdentifier: 'UserAlpha',
            consentConfirmed: true
        });
        if (res.status !== 201) {
            console.error('Import error details:', res.body);
        }
        expect(res.status).toBe(201);
        expect(res.body.status).toBe('completed');
        expect(res.body.extractedOwnerMessagesCount).toBe(2);
        expect(res.body.extractedContactMessagesCount).toBe(1);
        expect(res.body.styleProfileUpdated).toBe(true);
        expect(res.body.detectedSlang).toContain('lah');
    });
    it('Step 6: Creates a contact with relationship and safe autoSend default (false)', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/contacts')
            .set('Authorization', tokenA)
            .send({
            name: 'Manager',
            relationship: 'boss_or_manager',
            preferredTone: 'professional',
            autoSendEnabled: false,
            sensitiveTopicsRequireReview: true,
            isPaused: false
        });
        expect(res.status).toBe(201);
        expect(res.body.name).toBe('Manager');
        expect(res.body.relationship).toBe('boss_or_manager');
        expect(res.body.autoSendEnabled).toBe(false);
        createdContactId = res.body.id;
    });
    it('Step 7-8: Generates reply and enforces deterministic safety policies', async () => {
        // Test safe message
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/replies/generate')
            .set('Authorization', tokenA)
            .send({
            contactId: createdContactId,
            incomingMessage: 'Can you update the timeline on the project?'
        });
        expect(res.status).toBe(201);
        expect(res.body.contactId).toBe(createdContactId);
        expect(res.body.generatedReply).toBeDefined();
        expect(res.body.safetyCheck.requiresManualReview).toBe(true); // Enforces review because autoSend is false
        createdDraftId = res.body.id;
    });
    it('Step 8b: Evaluates deterministic safety trigger on sensitive monetary request', async () => {
        const res = await (0, supertest_1.default)(app)
            .post('/api/v1/replies/generate')
            .set('Authorization', tokenA)
            .send({
            contactId: createdContactId,
            incomingMessage: 'Please transfer $500 to my bank account immediately'
        });
        expect(res.status).toBe(201);
        expect(res.body.safetyCheck.isSafe).toBe(false);
        expect(res.body.safetyCheck.requiresManualReview).toBe(true);
        expect(res.body.safetyCheck.riskFlags).toContain('financial_commitment');
    });
    it('Step 9-10: Edits/Approves draft and records learning feedback', async () => {
        const patchRes = await (0, supertest_1.default)(app)
            .patch(`/api/v1/drafts/${createdDraftId}`)
            .set('Authorization', tokenA)
            .send({
            reviewStatus: 'approved',
            editedReply: 'Will review and provide the timeline by 4pm today.'
        });
        expect(patchRes.status).toBe(200);
        expect(patchRes.body.reviewStatus).toBe('approved');
        expect(patchRes.body.editedReply).toBe('Will review and provide the timeline by 4pm today.');
        // Submit feedback
        const fbRes = await (0, supertest_1.default)(app)
            .post(`/api/v1/drafts/${createdDraftId}/feedback`)
            .set('Authorization', tokenA)
            .send({
            draftId: createdDraftId,
            rating: 'helpful',
            ownerCorrection: 'Timeline will be sent by 4pm.'
        });
        expect(fbRes.status).toBe(201);
        expect(fbRes.body.success).toBe(true);
    });
    it('Security Audit: Enforces cross-user data isolation between UserAlpha and UserBeta', async () => {
        // UserBeta tries to access UserAlpha's draft
        const patchUnauthorized = await (0, supertest_1.default)(app)
            .patch(`/api/v1/drafts/${createdDraftId}`)
            .set('Authorization', tokenB)
            .send({
            reviewStatus: 'rejected'
        });
        // In Firestore multi-tenant subcollection hierarchy, UserBeta looks under users/user_beta/drafts/createdDraftId -> 404
        expect(patchUnauthorized.status).toBe(404);
        // UserBeta cannot generate reply using UserAlpha's contactId
        const replyUnauthorized = await (0, supertest_1.default)(app)
            .post('/api/v1/replies/generate')
            .set('Authorization', tokenB)
            .send({
            contactId: createdContactId,
            incomingMessage: 'Hello'
        });
        expect(replyUnauthorized.status).toBe(404);
    });
    it('Step 12: Exports user data package and performs complete deletion', async () => {
        // 1. Export
        const exportRes = await (0, supertest_1.default)(app)
            .post('/api/v1/privacy/export')
            .set('Authorization', tokenA);
        expect(exportRes.status).toBe(200);
        expect(exportRes.body.success).toBe(true);
        expect(exportRes.body.data.profile).toBeDefined();
        expect(exportRes.body.data.contacts.length).toBeGreaterThan(0);
        expect(exportRes.body.data.drafts.length).toBeGreaterThan(0);
        // 2. Erase
        const deleteRes = await (0, supertest_1.default)(app)
            .delete('/api/v1/me/data')
            .set('Authorization', tokenA);
        expect(deleteRes.status).toBe(200);
        expect(deleteRes.body.success).toBe(true);
        // 3. Confirm contacts are purged
        const checkContacts = await (0, supertest_1.default)(app)
            .get('/api/v1/contacts')
            .set('Authorization', tokenA);
        expect(checkContacts.body).toEqual([]);
    });
    describe('PHASE 3 & PHASE 4: WhatsApp Provider & Official Webhook Integration', () => {
        it('returns objective capability report for personal WhatsApp account', async () => {
            const res = await (0, supertest_1.default)(app)
                .get('/api/v1/integrations/whatsapp/capabilities')
                .set('Authorization', tokenA);
            expect(res.status).toBe(200);
            expect(res.body.accountType).toBe('normal_personal_whatsapp');
            expect(res.body.canAutoReplyWithDashboardClosed).toBe(false);
            expect(res.body.supportedProviders.length).toBeGreaterThan(0);
        });
        it('verifies Meta Cloud API Webhook challenge verification', async () => {
            process.env.META_WEBHOOK_VERIFY_TOKEN = 'test_verify_token';
            const verifyRes = await (0, supertest_1.default)(app)
                .get('/api/v1/integrations/whatsapp/webhook')
                .query({
                'hub.mode': 'subscribe',
                'hub.verify_token': 'test_verify_token',
                'hub.challenge': 'CHALLENGE_ACCEPTED_12345'
            });
            expect(verifyRes.status).toBe(200);
            expect(verifyRes.text).toBe('CHALLENGE_ACCEPTED_12345');
            const rejectRes = await (0, supertest_1.default)(app)
                .get('/api/v1/integrations/whatsapp/webhook')
                .query({
                'hub.mode': 'subscribe',
                'hub.verify_token': 'wrong_token',
                'hub.challenge': 'CHALLENGE_FAILED'
            });
            expect(rejectRes.status).toBe(403);
        });
        it('rejects sending outbound message when credentials are missing or blocked', async () => {
            const sendRes = await (0, supertest_1.default)(app)
                .post('/api/v1/integrations/whatsapp/send')
                .set('Authorization', tokenA)
                .send({
                to: '60123456789',
                text: 'Hello from Project Mani'
            });
            expect(sendRes.status).toBe(400);
            expect(sendRes.body.error).toBe('ProviderUnavailable');
        });
    });
    describe('PHASE 5: AI Personality, Reply Engine & Provider Distinction', () => {
        it('creates draft with isRealAI properly distinguished and respects safety policies', async () => {
            // Re-create contact for test
            const contactRes = await (0, supertest_1.default)(app)
                .post('/api/v1/contacts')
                .set('Authorization', tokenA)
                .send({
                name: 'Partner',
                relationship: 'romantic_partner',
                preferredTone: 'warm_and_affectionate',
                autoSendEnabled: false
            });
            expect(contactRes.status).toBe(201);
            const contactId = contactRes.body.id;
            const replyRes = await (0, supertest_1.default)(app)
                .post('/api/v1/replies/generate')
                .set('Authorization', tokenA)
                .send({
                contactId,
                incomingMessage: 'Hey love, free tonight?'
            });
            expect(replyRes.status).toBe(201);
            expect(replyRes.body.generatedReply).toBeDefined();
            expect(replyRes.body.isRealAI).toBeDefined();
            expect(replyRes.body.safetyCheck.requiresManualReview).toBe(true);
        });
    });
    describe('PHASE 6 & PHASE 8: Automation Controls, Emergency Stop & Audit Verification', () => {
        it('persists Mani automation settings and executes emergency stop successfully', async () => {
            // 1. Update settings
            const settingsUpdate = await (0, supertest_1.default)(app)
                .put('/api/v1/integrations/whatsapp/settings')
                .set('Authorization', tokenA)
                .send({
                maniGlobalEnabled: true,
                autoSendEnabled: false,
                activeProvider: 'clipboard_share_manual',
                replyDelaySeconds: 10,
                quietHoursEnabled: true,
                emergencyStop: false
            });
            expect(settingsUpdate.status).toBe(200);
            expect(settingsUpdate.body.maniGlobalEnabled).toBe(true);
            expect(settingsUpdate.body.replyDelaySeconds).toBe(10);
            // 2. Trigger Emergency Stop
            const stopRes = await (0, supertest_1.default)(app)
                .post('/api/v1/integrations/whatsapp/emergency-stop')
                .set('Authorization', tokenA);
            expect(stopRes.status).toBe(200);
            expect(stopRes.body.success).toBe(true);
            // 3. Confirm settings reflect emergencyStop = true and maniGlobalEnabled = false
            const getSettings = await (0, supertest_1.default)(app)
                .get('/api/v1/integrations/whatsapp/settings')
                .set('Authorization', tokenA);
            expect(getSettings.status).toBe(200);
            expect(getSettings.body.emergencyStop).toBe(true);
            expect(getSettings.body.maniGlobalEnabled).toBe(false);
            // 4. Verify emergency stop blocks sending attempts
            const blockedSend = await (0, supertest_1.default)(app)
                .post('/api/v1/integrations/whatsapp/send')
                .set('Authorization', tokenA)
                .send({
                to: '60123456789',
                text: 'Should be blocked by emergency stop'
            });
            expect(blockedSend.status).toBe(403);
            expect(blockedSend.body.error).toBe('EmergencyStopActive');
        });
        it('retrieves diagnostic activity logs for user with full event history', async () => {
            const logsRes = await (0, supertest_1.default)(app)
                .get('/api/v1/privacy/logs')
                .set('Authorization', tokenA);
            expect(logsRes.status).toBe(200);
            expect(Array.isArray(logsRes.body)).toBe(true);
            expect(logsRes.body.length).toBeGreaterThan(0);
            expect(logsRes.body[0].eventType).toBeDefined();
            expect(logsRes.body[0].timestamp).toBeDefined();
        });
        it('creates, deletes a contact, and enforces cross-user deletion safety', async () => {
            // Create contact for UserAlpha
            const createRes = await (0, supertest_1.default)(app)
                .post('/api/v1/contacts')
                .set('Authorization', tokenA)
                .send({
                name: 'ContactToDelete',
                relationship: 'friend',
                preferredTone: 'casual',
                autoSendEnabled: false,
                isPaused: false
            });
            expect(createRes.status).toBe(201);
            const toDeleteId = createRes.body.id;
            // UserBeta attempts to delete UserAlpha's contact -> 404
            const deleteUnauthorized = await (0, supertest_1.default)(app)
                .delete(`/api/v1/contacts/${toDeleteId}`)
                .set('Authorization', tokenB);
            expect(deleteUnauthorized.status).toBe(404);
            // UserAlpha deletes the contact -> 200
            const deleteSuccess = await (0, supertest_1.default)(app)
                .delete(`/api/v1/contacts/${toDeleteId}`)
                .set('Authorization', tokenA);
            expect(deleteSuccess.status).toBe(200);
            expect(deleteSuccess.body.success).toBe(true);
            // Subsequent delete returns 404
            const deleteAgain = await (0, supertest_1.default)(app)
                .delete(`/api/v1/contacts/${toDeleteId}`)
                .set('Authorization', tokenA);
            expect(deleteAgain.status).toBe(404);
        });
    });
    describe('WhatsApp QR Session Lifecycle & Tenant Isolation', () => {
        const { setCustomQRProvider } = require('../providers/qrProvider');
        afterEach(() => {
            setCustomQRProvider(null);
        });
        it('returns not_configured error when no supported QR provider is configured', async () => {
            setCustomQRProvider(null);
            const res = await (0, supertest_1.default)(app)
                .post('/api/v1/integrations/whatsapp/session/connect')
                .set('Authorization', tokenA);
            expect(res.status).toBe(400);
            expect(res.body.status).toBe('not_configured');
            expect(res.body.error).toBe('ProviderNotConfigured');
            expect(res.body.qrPayload).toBeUndefined();
            expect(res.body.message).toContain('WhatsApp Linked Devices QR provider is not configured');
        });
        it('manages real QR lifecycle with expiration, provider confirmation, tenant isolation, and disconnect', async () => {
            let isConnected = false;
            const mockTestQRProvider = {
                name: 'MockTestQRProvider',
                isConfigured: () => true,
                initiateSession: async (userId) => ({
                    sessionId: `sess_test_${userId}_${Date.now()}`,
                    userId,
                    status: 'qr_ready',
                    qrPayload: `2@test_qr_payload_${userId},abc123456789`,
                    expiresAt: new Date(Date.now() + 60000).toISOString()
                }),
                getSessionStatus: async (userId, sessionId) => ({
                    sessionId,
                    userId,
                    status: isConnected ? 'connected' : 'qr_ready',
                    qrPayload: isConnected ? undefined : `2@test_qr_payload_${userId}`,
                    connectedPhone: isConnected ? '+60123456789' : undefined
                }),
                disconnect: async () => {
                    isConnected = false;
                }
            };
            setCustomQRProvider(mockTestQRProvider);
            // 1. Connect initiates session and returns real QR payload
            const connectRes = await (0, supertest_1.default)(app)
                .post('/api/v1/integrations/whatsapp/session/connect')
                .set('Authorization', tokenA);
            expect(connectRes.status).toBe(200);
            expect(connectRes.body.status).toBe('qr_ready');
            expect(connectRes.body.qrPayload).toContain('2@test_qr_payload_user_alpha');
            expect(connectRes.body.instructions).toBeDefined();
            expect(connectRes.body.instructions[0]).toContain('Open WhatsApp');
            const sessionIdA = connectRes.body.sessionId;
            // 2. Tenant isolation: User B cannot see User A's session
            const userBStatus = await (0, supertest_1.default)(app)
                .get('/api/v1/integrations/whatsapp/session/status')
                .set('Authorization', tokenB);
            expect(userBStatus.body.status).toBe('not_configured');
            expect(userBStatus.body.sessionId).toBeUndefined();
            // 3. User A status is qr_ready
            const userAStatus = await (0, supertest_1.default)(app)
                .get('/api/v1/integrations/whatsapp/session/status')
                .set('Authorization', tokenA);
            expect(userAStatus.status).toBe(200);
            expect(userAStatus.body.status).toBe('qr_ready');
            expect(userAStatus.body.sessionId).toBe(sessionIdA);
            // 4. Provider confirms linking
            const linkRes = await (0, supertest_1.default)(app)
                .post('/api/v1/integrations/whatsapp/session/simulate-link')
                .set('Authorization', tokenA)
                .send({ phoneNumber: '+60129998888' });
            expect(linkRes.status).toBe(200);
            expect(linkRes.body.status).toBe('connected');
            expect(linkRes.body.connectedPhone).toBe('+60129998888');
            // 5. Subsequent status shows connected
            const confirmedStatus = await (0, supertest_1.default)(app)
                .get('/api/v1/integrations/whatsapp/session/status')
                .set('Authorization', tokenA);
            expect(confirmedStatus.body.status).toBe('connected');
            expect(confirmedStatus.body.connectedPhone).toBe('+60129998888');
            // 6. Disconnect invalidates the session
            const disconnectRes = await (0, supertest_1.default)(app)
                .post('/api/v1/integrations/whatsapp/session/disconnect')
                .set('Authorization', tokenA);
            expect(disconnectRes.status).toBe(200);
            expect(disconnectRes.body.status).toBe('disconnected');
            // 7. Verify status is disconnected
            const postDisconnectStatus = await (0, supertest_1.default)(app)
                .get('/api/v1/integrations/whatsapp/session/status')
                .set('Authorization', tokenA);
            expect(postDisconnectStatus.body.status).toBe('disconnected');
        });
    });
});
