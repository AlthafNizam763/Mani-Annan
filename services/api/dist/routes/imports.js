"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const firebase_1 = require("../firebase");
const contracts_1 = require("@project-echo/contracts");
const chatParser_1 = require("../engine/chatParser");
const styleExtractor_1 = require("../engine/styleExtractor");
exports.importsRouter = (0, express_1.Router)();
// POST /api/v1/imports
exports.importsRouter.post('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const body = contracts_1.ImportChatRequestSchema.parse(req.body);
        // 1. Parse raw text and extract owner messages separately
        const parsed = (0, chatParser_1.parseWhatsAppChat)(body.rawText, body.ownerIdentifier);
        // 2. Fetch current style profile
        const userDocRef = firebase_1.db.collection('users').doc(uid);
        const userDoc = await userDocRef.get();
        const existingProfile = userDoc.exists ? userDoc.data()?.styleProfile : undefined;
        // 3. Extract updated writing style profile exclusively from owner messages
        const updatedProfile = (0, styleExtractor_1.extractStyleProfile)(parsed.ownerMessages, existingProfile);
        // 4. Save import batch record
        const importRef = firebase_1.db.collection('users').doc(uid).collection('imports').doc();
        const importRecord = {
            id: importRef.id,
            createdAt: new Date().toISOString(),
            ownerIdentifier: body.ownerIdentifier,
            contactName: body.contactName || 'Unspecified',
            totalParsed: parsed.totalParsed,
            extractedOwnerCount: parsed.ownerMessages.length,
            extractedCounterpartyCount: parsed.counterpartyMessages.length,
            status: 'completed'
        };
        await importRef.set(importRecord);
        // 5. Store relevant few-shot examples from owner messages
        const batch = firebase_1.db.batch();
        const examplesToStore = parsed.ownerMessages.slice(0, 15);
        for (const msg of examplesToStore) {
            const exRef = firebase_1.db.collection('users').doc(uid).collection('examples').doc();
            batch.set(exRef, {
                id: exRef.id,
                importId: importRef.id,
                text: msg.text,
                relationshipCategory: 'general',
                createdAt: new Date().toISOString()
            });
        }
        // 6. Persist updated style profile
        batch.set(userDocRef, { styleProfile: updatedProfile }, { merge: true });
        // 7. Audit log event
        const auditRef = firebase_1.db.collection('users').doc(uid).collection('auditEvents').doc();
        batch.set(auditRef, {
            id: auditRef.id,
            timestamp: new Date().toISOString(),
            eventType: 'import_chat',
            decision: 'completed',
            reasonCode: 'OWNER_CHAT_IMPORT_SUCCESS',
            metadata: {
                importId: importRef.id,
                ownerMessagesCount: parsed.ownerMessages.length
            }
        });
        await batch.commit();
        res.status(201).json({
            importId: importRef.id,
            status: 'completed',
            extractedOwnerMessagesCount: parsed.ownerMessages.length,
            extractedContactMessagesCount: parsed.counterpartyMessages.length,
            styleProfileUpdated: true,
            detectedSlang: updatedProfile.commonSlang,
            summary: `Extracted ${parsed.ownerMessages.length} authentic owner messages. Analyzed Manglish and tone markers.`
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/v1/imports
exports.importsRouter.get('/', auth_1.authenticateToken, async (req, res) => {
    const uid = req.user.uid;
    const snap = await firebase_1.db.collection('users').doc(uid).collection('imports').get();
    const imports = snap.docs.map(doc => doc.data());
    res.json(imports);
});
// DELETE /api/v1/imports/:importId
exports.importsRouter.delete('/:importId', auth_1.authenticateToken, async (req, res) => {
    const uid = req.user.uid;
    const { importId } = req.params;
    await firebase_1.db.collection('users').doc(uid).collection('imports').doc(importId).delete();
    // Clean up associated derived examples
    const examplesSnap = await firebase_1.db.collection('users').doc(uid).collection('examples')
        .where('importId', '==', importId)
        .get();
    const batch = firebase_1.db.batch();
    examplesSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    res.json({ success: true, message: `Import ${importId} and derived examples deleted.` });
});
