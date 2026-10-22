"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.privacyRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const firebase_1 = require("../firebase");
exports.privacyRouter = (0, express_1.Router)();
// POST /api/v1/privacy/export
exports.privacyRouter.post('/export', auth_1.authenticateToken, async (req, res) => {
    const uid = req.user.uid;
    const userDoc = await firebase_1.db.collection('users').doc(uid).get();
    const contactsSnap = await firebase_1.db.collection('users').doc(uid).collection('contacts').get();
    const importsSnap = await firebase_1.db.collection('users').doc(uid).collection('imports').get();
    const examplesSnap = await firebase_1.db.collection('users').doc(uid).collection('examples').get();
    const draftsSnap = await firebase_1.db.collection('users').doc(uid).collection('drafts').get();
    const feedbackSnap = await firebase_1.db.collection('users').doc(uid).collection('feedback').get();
    const exportPayload = {
        exportedAt: new Date().toISOString(),
        profile: userDoc.data() || {},
        contacts: contactsSnap.docs.map(d => d.data()),
        imports: importsSnap.docs.map(d => d.data()),
        examples: examplesSnap.docs.map(d => d.data()),
        drafts: draftsSnap.docs.map(d => d.data()),
        feedback: feedbackSnap.docs.map(d => d.data())
    };
    // Audit log event
    await firebase_1.db.collection('users').doc(uid).collection('auditEvents').add({
        timestamp: new Date().toISOString(),
        eventType: 'privacy_export',
        decision: 'completed',
        reasonCode: 'USER_INITIATED_DATA_EXPORT'
    });
    res.json({
        success: true,
        data: exportPayload
    });
});
// DELETE /api/v1/me/data (Full GDPR/PDPA compliant wipeout)
exports.privacyRouter.delete('/data', auth_1.authenticateToken, async (req, res) => {
    const uid = req.user.uid;
    const collections = ['contacts', 'imports', 'examples', 'drafts', 'feedback', 'rules', 'auditEvents', 'settings'];
    for (const collName of collections) {
        const snap = await firebase_1.db.collection('users').doc(uid).collection(collName).get();
        const batch = firebase_1.db.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
    }
    // Delete root user document
    await firebase_1.db.collection('users').doc(uid).delete();
    res.json({
        success: true,
        message: 'All personal data, style profiles, chat imports, drafts, and examples have been permanently erased.'
    });
});
// GET /api/v1/privacy/logs (Diagnostic and audit activity logs)
exports.privacyRouter.get('/logs', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const snap = await firebase_1.db.collection('users').doc(uid).collection('auditEvents').orderBy('timestamp', 'desc').limit(50).get();
        const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(logs);
    }
    catch (err) {
        next(err);
    }
});
