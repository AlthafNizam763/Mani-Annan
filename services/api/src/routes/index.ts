import { Router } from 'express';
import { meRouter } from './me';
import { importsRouter } from './imports';
import { contactsRouter } from './contacts';
import { repliesRouter } from './replies';
import { draftsRouter } from './drafts';
import { privacyRouter } from './privacy';
import { whatsappRouter } from './whatsapp';

export const router = Router();

router.use('/me', meRouter);
router.use('/me', privacyRouter); // mounts /me/data
router.use('/imports', importsRouter);
router.use('/contacts', contactsRouter);
router.use('/replies', repliesRouter);
router.use('/drafts', draftsRouter);
router.use('/privacy', privacyRouter);
router.use('/integrations/whatsapp', whatsappRouter);

