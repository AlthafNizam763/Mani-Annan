import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { db } from '../firebase';
import { StyleProfileSchema } from '@project-echo/contracts';

export const meRouter = Router();

// GET /api/v1/me
meRouter.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const userDocRef = db.collection('users').doc(uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      const initialProfile = {
        uid,
        email: req.user!.email || '',
        createdAt: new Date().toISOString(),
        styleProfile: {
          version: 1,
          primaryLanguages: ['en'],
          usesManglish: true,
          commonSlang: ['lah', 'bro', 'machan'],
          avgSentenceLength: 'short',
          punctuationHabits: {
            multipleExclamations: false,
            usesEllipsis: true,
            omitsEndingPeriod: true,
            questionMarksOnlyWhenNeeded: true
          },
          emojiHabits: {
            frequentEmojis: ['👍', '🔥', '😂'],
            emojiFrequency: 'moderate'
          },
          greetingStyle: 'informal',
          closingStyle: 'casual',
          updatedAt: new Date().toISOString()
        }
      };
      await userDocRef.set(initialProfile);
      res.json(initialProfile);
      return;
    }

    res.json(userDoc.data());
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/me/style
meRouter.put('/style', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const validatedStyle = StyleProfileSchema.parse(req.body);

    const userDocRef = db.collection('users').doc(uid);
    await userDocRef.set(
      {
        styleProfile: {
          ...validatedStyle,
          updatedAt: new Date().toISOString()
        }
      },
      { merge: true }
    );

    res.json({
      success: true,
      message: 'Style profile updated successfully',
      styleProfile: validatedStyle
    });
  } catch (err) {
    next(err);
  }
});
