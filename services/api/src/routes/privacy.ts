import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { db } from '../firebase';

export const privacyRouter = Router();

// POST /api/v1/privacy/export
privacyRouter.post('/export', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user!.uid;

  const userDoc = await db.collection('users').doc(uid).get();
  const contactsSnap = await db.collection('users').doc(uid).collection('contacts').get();
  const importsSnap = await db.collection('users').doc(uid).collection('imports').get();
  const examplesSnap = await db.collection('users').doc(uid).collection('examples').get();
  const draftsSnap = await db.collection('users').doc(uid).collection('drafts').get();
  const feedbackSnap = await db.collection('users').doc(uid).collection('feedback').get();

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
  await db.collection('users').doc(uid).collection('auditEvents').add({
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
privacyRouter.delete('/data', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user!.uid;

  const collections = ['contacts', 'imports', 'examples', 'drafts', 'feedback', 'rules', 'auditEvents', 'settings'];

  for (const collName of collections) {
    const snap = await db.collection('users').doc(uid).collection(collName).get();
    const batch = db.batch();
    snap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
  }

  // Delete root user document
  await db.collection('users').doc(uid).delete();

  res.json({
    success: true,
    message: 'All personal data, style profiles, chat imports, drafts, and examples have been permanently erased.'
  });
});

// GET /api/v1/privacy/logs (Diagnostic and audit activity logs)
privacyRouter.get('/logs', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const snap = await db.collection('users').doc(uid).collection('auditEvents').orderBy('timestamp', 'desc').limit(50).get();
    const logs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(logs);
  } catch (err) {
    next(err);
  }
});
