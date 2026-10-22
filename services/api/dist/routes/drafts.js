"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.draftsRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const firebase_1 = require("../firebase");
const contracts_1 = require("@project-echo/contracts");
exports.draftsRouter = (0, express_1.Router)();
// GET /api/v1/drafts
exports.draftsRouter.get('/', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const snap = await firebase_1.db.collection('users').doc(uid).collection('drafts').orderBy('createdAt', 'desc').limit(50).get();
        const drafts = snap.docs.map(doc => doc.data());
        res.json(drafts);
    }
    catch (err) {
        next(err);
    }
});
// PATCH /api/v1/drafts/:draftId
exports.draftsRouter.patch('/:draftId', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const { draftId } = req.params;
        const { reviewStatus, editedReply } = contracts_1.UpdateDraftReviewRequestSchema.parse(req.body);
        const draftRef = firebase_1.db.collection('users').doc(uid).collection('drafts').doc(draftId);
        const existing = await draftRef.get();
        if (!existing.exists) {
            res.status(404).json({ error: 'NotFound', message: 'Draft not found' });
            return;
        }
        const updates = {
            reviewStatus,
            reviewedAt: new Date().toISOString()
        };
        if (editedReply !== undefined) {
            updates.editedReply = editedReply;
        }
        await draftRef.update(updates);
        // If edited by owner, add as an authorized style learning example
        if (editedReply && (reviewStatus === 'edited' || reviewStatus === 'approved')) {
            await firebase_1.db.collection('users').doc(uid).collection('examples').add({
                text: editedReply,
                source: 'owner_correction',
                relationshipCategory: existing.data()?.relationship || 'general',
                createdAt: new Date().toISOString()
            });
        }
        // Audit event
        await firebase_1.db.collection('users').doc(uid).collection('auditEvents').add({
            timestamp: new Date().toISOString(),
            eventType: reviewStatus === 'approved' ? 'draft_approved' : 'draft_rejected',
            decision: 'completed',
            reasonCode: `DRAFT_STATUS_${reviewStatus.toUpperCase()}`,
            metadata: { draftId }
        });
        res.json({ id: draftId, ...existing.data(), ...updates });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/v1/drafts/:draftId/feedback
exports.draftsRouter.post('/:draftId/feedback', auth_1.authenticateToken, async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const { draftId } = req.params;
        const feedback = contracts_1.DraftFeedbackRequestSchema.parse(req.body);
        const feedbackRef = firebase_1.db.collection('users').doc(uid).collection('feedback').doc();
        await feedbackRef.set({
            ...feedback,
            id: feedbackRef.id,
            draftId,
            createdAt: new Date().toISOString()
        });
        // If owner provided a correction, persist it as a prioritized writing example
        if (feedback.ownerCorrection) {
            await firebase_1.db.collection('users').doc(uid).collection('examples').add({
                text: feedback.ownerCorrection,
                source: 'feedback_correction',
                createdAt: new Date().toISOString()
            });
        }
        res.status(201).json({
            success: true,
            message: 'Feedback recorded. Learning model updated with correction.'
        });
    }
    catch (err) {
        next(err);
    }
});
