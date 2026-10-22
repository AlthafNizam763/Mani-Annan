import { Router } from 'express';
import { meRouter } from './me';
import { importsRouter } from './imports';
import { contactsRouter } from './contacts';
import { repliesRouter } from './replies';
import { draftsRouter } from './drafts';
import { privacyRouter } from './privacy';
import { whatsappRouter } from './whatsapp';

export const router = Router();
 
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    version: 'v1',
    service: 'mani-annan-api',
    endpoints: [
      '/api/v1/me',
      '/api/v1/contacts',
      '/api/v1/imports',
      '/api/v1/drafts',
      '/api/v1/replies',
      '/api/v1/privacy',
      '/api/v1/integrations/whatsapp'
    ]
  });
});

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'mani-annan-api'
  });
});

router.use('/me', meRouter);
router.use('/me', privacyRouter); // mounts /me/data
router.use('/imports', importsRouter);
router.use('/contacts', contactsRouter);
router.use('/replies', repliesRouter);
router.use('/drafts', draftsRouter);
router.use('/privacy', privacyRouter);
router.use('/integrations/whatsapp', whatsappRouter);

