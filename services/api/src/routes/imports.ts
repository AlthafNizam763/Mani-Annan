import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { db } from '../firebase';
import { ImportChatRequestSchema } from '@project-echo/contracts';
import { parseWhatsAppChat } from '../engine/chatParser';
import { extractStyleProfile } from '../engine/styleExtractor';

export const importsRouter = Router();

// POST /api/v1/imports
importsRouter.post('/', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const body = ImportChatRequestSchema.parse(req.body);

    // 1. Parse raw text and extract owner messages separately
    const parsed = parseWhatsAppChat(body.rawText, body.ownerIdentifier);

    // 2. Fetch current style profile
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();
    const existingProfile = userDoc.exists ? userDoc.data()?.styleProfile : undefined;

    // 3. Extract updated writing style profile exclusively from owner messages
    const updatedProfile = extractStyleProfile(parsed.ownerMessages, existingProfile);

    // 4. Save import batch record
    const importRef = db.collection('users').doc(uid).collection('imports').doc();
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
    const batch = db.batch();
    const examplesToStore = parsed.ownerMessages.slice(0, 15);
    for (const msg of examplesToStore) {
      const exRef = db.collection('users').doc(uid).collection('examples').doc();
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
    const auditRef = db.collection('users').doc(uid).collection('auditEvents').doc();
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
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/imports
importsRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user!.uid;
  const snap = await db.collection('users').doc(uid).collection('imports').get();
  const imports = snap.docs.map(doc => doc.data());
  res.json(imports);
});

// DELETE /api/v1/imports/:importId
importsRouter.delete('/:importId', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user!.uid;
  const { importId } = req.params;

  await db.collection('users').doc(uid).collection('imports').doc(importId).delete();

  // Clean up associated derived examples
  const examplesSnap = await db.collection('users').doc(uid).collection('examples')
    .where('importId', '==', importId)
    .get();

  const batch = db.batch();
  examplesSnap.docs.forEach(doc => batch.delete(doc.ref));
  await batch.commit();

  res.json({ success: true, message: `Import ${importId} and derived examples deleted.` });
});
