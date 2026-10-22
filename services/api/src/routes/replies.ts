import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { db } from '../firebase';
import { GenerateReplyRequestSchema } from '@project-echo/contracts';
import { generationLimiter } from '../middlewares/rateLimit';
import { getLLMProvider } from '../ai';
import { evaluateDeterministicPolicies } from '../engine/policyEngine';

export const repliesRouter = Router();

// POST /api/v1/replies/generate
repliesRouter.post(
  '/generate',
  authenticateToken,
  generationLimiter,
  async (req: AuthenticatedRequest, res: Response, next) => {
    try {
      const uid = req.user!.uid;
      const { contactId, incomingMessage, optionalContext } = GenerateReplyRequestSchema.parse(req.body);

      // 1. Fetch contact configuration
      const contactDoc = await db.collection('users').doc(uid).collection('contacts').doc(contactId).get();
      if (!contactDoc.exists) {
        res.status(404).json({ error: 'NotFound', message: `Contact with ID ${contactId} not found` });
        return;
      }
      const contact = contactDoc.data() as any;

      // 2. Fetch owner's style profile
      const userDoc = await db.collection('users').doc(uid).get();
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
      const examplesSnap = await db.collection('users').doc(uid).collection('examples').limit(4).get();
      const relevantExamples = examplesSnap.docs.map(doc => doc.data().text as string);

      // 4. Generate reply via backend LLM abstraction
      const llm = getLLMProvider();
      const result = await llm.generateReply({
        contact,
        ownerStyle,
        incomingMessage,
        relevantExamples,
        optionalContext
      });

      // 5. Evaluate deterministic safety & policy rules outside LLM
      const safetyCheck = evaluateDeterministicPolicies({
        contact,
        incomingMessage,
        generatedReply: result.replyText
      });

      // 6. Save reply draft in Firestore
      const draftRef = db.collection('users').doc(uid).collection('drafts').doc();
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
      await db.collection('users').doc(uid).collection('auditEvents').doc().set({
        id: db.collection('users').doc().id,
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
    } catch (err) {
      next(err);
    }
  }
);
