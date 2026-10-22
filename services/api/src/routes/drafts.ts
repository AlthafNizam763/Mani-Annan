import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { db } from '../firebase';
import {
  UpdateDraftReviewRequestSchema,
  DraftFeedbackRequestSchema
} from '@project-echo/contracts';

export const draftsRouter = Router();

// GET /api/v1/drafts
draftsRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const snap = await db.collection('users').doc(uid).collection('drafts').orderBy('createdAt', 'desc').limit(50).get();
    const drafts = snap.docs.map(doc => doc.data());
    res.json(drafts);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/v1/drafts/:draftId
draftsRouter.patch('/:draftId', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const { draftId } = req.params;
    const { reviewStatus, editedReply } = UpdateDraftReviewRequestSchema.parse(req.body);

    const draftRef = db.collection('users').doc(uid).collection('drafts').doc(draftId);
    const existing = await draftRef.get();

    if (!existing.exists) {
      res.status(404).json({ error: 'NotFound', message: 'Draft not found' });
      return;
    }

    const updates: any = {
      reviewStatus,
      reviewedAt: new Date().toISOString()
    };
    if (editedReply !== undefined) {
      updates.editedReply = editedReply;
    }

    await draftRef.update(updates);

    // If edited by owner, add as an authorized style learning example
    if (editedReply && (reviewStatus === 'edited' || reviewStatus === 'approved')) {
      await db.collection('users').doc(uid).collection('examples').add({
        text: editedReply,
        source: 'owner_correction',
        relationshipCategory: existing.data()?.relationship || 'general',
        createdAt: new Date().toISOString()
      });
    }

    // Audit event
    await db.collection('users').doc(uid).collection('auditEvents').add({
      timestamp: new Date().toISOString(),
      eventType: reviewStatus === 'approved' ? 'draft_approved' : 'draft_rejected',
      decision: 'completed',
      reasonCode: `DRAFT_STATUS_${reviewStatus.toUpperCase()}`,
      metadata: { draftId }
    });

    res.json({ id: draftId, ...existing.data(), ...updates });
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/drafts/:draftId/feedback
draftsRouter.post('/:draftId/feedback', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const { draftId } = req.params;
    const feedback = DraftFeedbackRequestSchema.parse(req.body);

    const feedbackRef = db.collection('users').doc(uid).collection('feedback').doc();
    await feedbackRef.set({
      ...feedback,
      id: feedbackRef.id,
      draftId,
      createdAt: new Date().toISOString()
    });

    // If owner provided a correction, persist it as a prioritized writing example
    if (feedback.ownerCorrection) {
      await db.collection('users').doc(uid).collection('examples').add({
        text: feedback.ownerCorrection,
        source: 'feedback_correction',
        createdAt: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Feedback recorded. Learning model updated with correction.'
    });
  } catch (err) {
    next(err);
  }
});
