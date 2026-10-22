"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repliesRouter = void 0;
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const firebase_1 = require("../firebase");
const contracts_1 = require("@project-echo/contracts");
const rateLimit_1 = require("../middlewares/rateLimit");
const ai_1 = require("../ai");
const policyEngine_1 = require("../engine/policyEngine");
exports.repliesRouter = (0, express_1.Router)();
// POST /api/v1/replies/generate
exports.repliesRouter.post('/generate', auth_1.authenticateToken, rateLimit_1.generationLimiter, async (req, res, next) => {
    try {
        const uid = req.user.uid;
        const { contactId, incomingMessage, optionalContext } = contracts_1.GenerateReplyRequestSchema.parse(req.body);
        // 1. Fetch contact configuration
        const contactDoc = await firebase_1.db.collection('users').doc(uid).collection('contacts').doc(contactId).get();
        if (!contactDoc.exists) {
            res.status(404).json({ error: 'NotFound', message: `Contact with ID ${contactId} not found` });
            return;
        }
        const contact = contactDoc.data();
        // 2. Fetch owner's style profile
        const userDoc = await firebase_1.db.collection('users').doc(uid).get();
        const ownerStyle = userDoc.data()?.styleProfile || {
            version: 1,
            primaryLanguages: ['en'],
            usesManglish: true,
            commonSlang: ['lah', 'bro', 'machan'],
            avgSentenceLength: 'short',
            punctuationHabits: { multipleExclamations: false, usesEllipsis: true, omitsEndingPeriod: true, questionMarksOnlyWhenNeeded: true },
            emojiHabits: { frequentEmojis: ['👍', '😂'], emojiFrequency: 'moderate' },
            greetingStyle: 'informal',
            closingStyle: 'casual'
        };
        // 3. Retrieve a small set of authorized examples (not the whole history)
        const examplesSnap = await firebase_1.db.collection('users').doc(uid).collection('examples').limit(4).get();
        const relevantExamples = examplesSnap.docs.map(doc => doc.data().text);
        // 4. Generate reply via backend LLM abstraction
        const llm = (0, ai_1.getLLMProvider)();
        const result = await llm.generateReply({
            contact,
            ownerStyle,
            incomingMessage,
            relevantExamples,
            optionalContext
        });
        // 5. Evaluate deterministic safety & policy rules outside LLM
        const safetyCheck = (0, policyEngine_1.evaluateDeterministicPolicies)({
            contact,
            incomingMessage,
            generatedReply: result.replyText
        });
        // 6. Save reply draft in Firestore
        const draftRef = firebase_1.db.collection('users').doc(uid).collection('drafts').doc();
        const draft = {
            id: draftRef.id,
            contactId,
            contactName: contact.name,
            relationship: contact.relationship,
            incomingMessage,
            generatedReply: result.replyText,
            safetyCheck,
            reviewStatus: 'pending',
            providerUsed: result.modelUsed,
            isRealAI: result.isRealAI,
            createdAt: new Date().toISOString()
        };
        await draftRef.set(draft);
        // 7. Audit log event
        await firebase_1.db.collection('users').doc(uid).collection('auditEvents').doc().set({
            id: firebase_1.db.collection('users').doc().id,
            timestamp: new Date().toISOString(),
            eventType: 'generate_reply',
            decision: safetyCheck.requiresManualReview ? 'manual_review_forced' : 'allowed',
            contactId,
            reasonCode: safetyCheck.riskFlags.join(',') || 'CLEARED_POLICY_CHECK',
            metadata: {
                draftId: draftRef.id,
                provider: result.modelUsed
            }
        });
        res.status(201).json(draft);
    }
    catch (err) {
        next(err);
    }
});
