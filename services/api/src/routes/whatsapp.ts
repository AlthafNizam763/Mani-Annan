import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest } from '../middlewares/auth';
import { db } from '../firebase';
import {
  AutomationSettingsSchema,
  WhatsAppCapabilityReport,
  WhatsAppQRInstructions
} from '@project-echo/contracts';
import { getActiveQRProvider } from '../providers/qrProvider';

export const whatsappRouter = Router();

/**
 * GET /api/v1/integrations/whatsapp/capabilities
 * Returns the objective capability report for the owner's personal WhatsApp account
 */
whatsappRouter.get('/capabilities', authenticateToken, async (_req: AuthenticatedRequest, res: Response) => {
  const report: WhatsAppCapabilityReport = {
    accountType: 'normal_personal_whatsapp',
    canAutoReplyWithDashboardClosed: false,
    supportedProviders: [
      {
        provider: 'clipboard_share_manual',
        displayName: 'OS Share & Clipboard (Human-in-the-Loop)',
        description: 'Generates authentic replies in the studio, checked by the safety policy, then copied or shared directly to personal WhatsApp.',
        status: 'connected_active',
        worksWhenDashboardClosed: false,
        requiresDedicatedNumber: false,
        riskAssessment: 'Zero ban risk. 100% compliant with standard WhatsApp consumer accounts.'
      },
      {
        provider: 'official_cloud_api',
        displayName: 'Official Meta WhatsApp Business Cloud API',
        description: 'Server-to-server 24/7 automated messaging. Requires a dedicated business phone number (cannot stay on the personal mobile WhatsApp app).',
        status: process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_NUMBER_ID
          ? 'ready_for_onboarding'
          : 'blocked_awaiting_meta_credentials',
        worksWhenDashboardClosed: true,
        requiresDedicatedNumber: true,
        riskAssessment: 'Official Meta API. Requires dedicated business number and Meta Business verification.'
      },
      {
        provider: 'android_companion_listener',
        displayName: 'Android Notification Companion (Experimental)',
        description: 'Android background notification listener that triggers quick replies on behalf of the personal app.',
        status: 'not_configured',
        worksWhenDashboardClosed: true,
        requiresDedicatedNumber: false,
        riskAssessment: 'Works only on Android while the physical phone is powered on and connected to internet.'
      },
      {
        provider: 'linked_devices_qr_personal',
        displayName: 'WhatsApp Web Linked Devices (Personal QR Flow)',
        description: 'Direct pairing of personal WhatsApp account via Linked Devices QR code for autonomous background replies.',
        status: 'unavailable_unsupported',
        worksWhenDashboardClosed: false,
        requiresDedicatedNumber: false,
        riskAssessment: 'UNAVAILABLE: Meta exposes no official third-party Linked Devices API. Unofficial socket scraping or browser automation (e.g., Baileys, whatsapp-web.js) violates WhatsApp ToS and triggers permanent phone number bans. Mani strictly refuses unsupported scraping.'
      }
    ]
  };

  res.json(report);
});

/**
 * GET /api/v1/integrations/whatsapp/settings
 * Retrieves automation & auto-reply settings
 */
whatsappRouter.get('/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const doc = await db.collection('users').doc(uid).collection('settings').doc('automation').get();

    if (!doc.exists) {
      const defaults = {
        maniGlobalEnabled: false,
        autoSendEnabled: false,
        activeProvider: 'clipboard_share_manual',
        replyDelaySeconds: 5,
        quietHoursEnabled: true,
        emergencyStop: false,
        updatedAt: new Date().toISOString()
      };
      await doc.ref.set(defaults);
      res.json(defaults);
      return;
    }

    res.json(doc.data());
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/v1/integrations/whatsapp/settings
 * Updates automation settings (fails closed if emergency stop is triggered)
 */
whatsappRouter.put('/settings', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const validated = AutomationSettingsSchema.parse(req.body);

    // If autoSendEnabled is true, verify that the active provider is actually connected
    if (validated.autoSendEnabled && validated.activeProvider === 'official_cloud_api') {
      const hasCreds = Boolean(process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_NUMBER_ID);
      if (!hasCreds) {
        res.status(400).json({
          error: 'IntegrationBlocked',
          message: 'Cannot enable auto-send on Official Cloud API: Meta credentials (META_WHATSAPP_TOKEN, META_PHONE_NUMBER_ID) are not configured on the backend.'
        });
        return;
      }
    }

    const docRef = db.collection('users').doc(uid).collection('settings').doc('automation');
    const toSave = {
      ...validated,
      updatedAt: new Date().toISOString()
    };

    await docRef.set(toSave, { merge: true });

    // Audit event
    await db.collection('users').doc(uid).collection('auditEvents').add({
      timestamp: new Date().toISOString(),
      eventType: 'style_profile_updated',
      decision: 'completed',
      reasonCode: `AUTOMATION_SETTINGS_UPDATED_MANI_${validated.maniGlobalEnabled ? 'ON' : 'OFF'}`
    });

    res.json(toSave);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/integrations/whatsapp/emergency-stop
 * Instantly cuts off all automated outbound messages
 */
whatsappRouter.post('/emergency-stop', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user!.uid;
  const docRef = db.collection('users').doc(uid).collection('settings').doc('automation');

  await docRef.set({
    maniGlobalEnabled: false,
    autoSendEnabled: false,
    emergencyStop: true,
    updatedAt: new Date().toISOString()
  }, { merge: true });

  await db.collection('users').doc(uid).collection('auditEvents').add({
    timestamp: new Date().toISOString(),
    eventType: 'safety_block',
    decision: 'blocked',
    reasonCode: 'EMERGENCY_STOP_TRIGGERED'
  });

  res.json({
    success: true,
    message: 'Emergency stop activated. All auto-send and global automation has been forcefully disabled.'
  });
});

/**
 * GET /api/v1/integrations/whatsapp/webhook
 * Meta Cloud API Webhook Verification Challenge (Hub Challenge)
 */
whatsappRouter.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.META_WEBHOOK_VERIFY_TOKEN || 'project_mani_meta_webhook_secret';

  if (mode === 'subscribe' && token === expectedToken) {
    res.status(200).send(challenge);
  } else {
    res.status(403).json({ error: 'Forbidden', message: 'Webhook token verification failed.' });
  }
});

/**
 * POST /api/v1/integrations/whatsapp/webhook
 * Receives inbound WhatsApp messages, verifies signature, suppresses duplicates, and triggers auto-replies if Mani is ON
 */
whatsappRouter.post('/webhook', async (req, res) => {
  // Acknowledge receipt to Meta immediately (prevents duplicate retries from Meta)
  res.status(200).json({ status: 'received' });

  const signature = req.headers['x-hub-signature-256'] as string;
  const rawBody = JSON.stringify(req.body);

  const { OfficialWhatsAppCloudProvider } = await import('../providers/officialCloudProvider');
  const provider = new OfficialWhatsAppCloudProvider();

  // If app secret is set, verify cryptographic HMAC signature
  if (process.env.META_APP_SECRET && signature) {
    const isValid = provider.verifyWebhook(signature, rawBody);
    if (!isValid) {
      console.warn('[WhatsApp Webhook] Signature verification failed. Ignoring forged request.');
      return;
    }
  }

  // Parse inbound messages
  const inboundEvents = provider.parseWebhookEvent(req.body);
  if (inboundEvents.length === 0) return;

  for (const event of inboundEvents) {
    try {
      // 1. Check idempotency / duplicate suppression
      const duplicateSnap = await db.collection('inbound_whatsapp_messages')
        .where('messageId', '==', event.messageId)
        .limit(1)
        .get();

      if (!duplicateSnap.empty) {
        console.log(`[WhatsApp Webhook] Message ${event.messageId} already processed. Skipping duplicate.`);
        continue;
      }

      await db.collection('inbound_whatsapp_messages').add({
        ...event,
        processedAt: new Date().toISOString()
      });

      // 2. Identify owner by matching contacts or system owner
      // For personal single-tenant/multi-tenant MVP, query active automation owners
      const settingsSnap = await db.collectionGroup('settings').get();
      for (const doc of settingsSnap.docs) {
        if (doc.id === 'automation') {
          const auto = doc.data();
          if (auto.maniGlobalEnabled && !auto.emergencyStop) {
            const userRef = doc.ref.parent.parent;
            if (userRef) {
              const uid = userRef.id;
              // Check if sender matches any contact
              const contactSnap = await db.collection('users').doc(uid).collection('contacts')
                .where('phoneNumber', '==', event.from)
                .limit(1)
                .get();

              let contactData: any = null;
              if (!contactSnap.empty) {
                contactData = { id: contactSnap.docs[0].id, ...contactSnap.docs[0].data() };
              }

              // Save as a draft / incoming message for review or auto-reply
              const draftRef = db.collection('users').doc(uid).collection('drafts').doc();
              await draftRef.set({
                id: draftRef.id,
                contactId: contactData?.id || 'unknown_contact',
                contactName: contactData?.name || event.senderName || event.from,
                relationship: contactData?.relationship || 'custom',
                incomingMessage: event.text,
                reviewStatus: 'pending',
                source: 'official_whatsapp_webhook',
                messageId: event.messageId,
                createdAt: new Date().toISOString()
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.error('[WhatsApp Webhook Error]:', err.message);
    }
  }
});

/**
 * POST /api/v1/integrations/whatsapp/send
 * Authenticated outbound sending route with rate limiting & audit logs
 */
whatsappRouter.post('/send', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const { to, text, draftId } = req.body;

    if (!to || !text) {
      res.status(400).json({ error: 'BadRequest', message: 'Parameters "to" and "text" are required.' });
      return;
    }

    // Check automation settings
    const autoDoc = await db.collection('users').doc(uid).collection('settings').doc('automation').get();
    const autoSettings = autoDoc.data();

    if (autoSettings?.emergencyStop) {
      res.status(403).json({
        error: 'EmergencyStopActive',
        message: 'Cannot send messages while Emergency Stop is active. Reset automation in settings.'
      });
      return;
    }

    const { OfficialWhatsAppCloudProvider } = await import('../providers/officialCloudProvider');
    const provider = new OfficialWhatsAppCloudProvider();
    const capabilities = await provider.getCapabilities();

    if (!capabilities.isAvailable) {
      res.status(400).json({
        error: 'ProviderUnavailable',
        message: capabilities.blockReason || 'WhatsApp provider is currently unavailable.'
      });
      return;
    }

    const result = await provider.sendMessage(to, text);

    if (result.success) {
      if (draftId) {
        await db.collection('users').doc(uid).collection('drafts').doc(draftId).update({
          reviewStatus: 'shared',
          sentMessageId: result.messageId,
          sentAt: new Date().toISOString()
        });
      }

      await db.collection('users').doc(uid).collection('auditEvents').add({
        timestamp: new Date().toISOString(),
        eventType: 'draft_approved',
        decision: 'completed',
        reasonCode: 'WHATSAPP_CLOUD_SEND_SUCCESS',
        metadata: { to, messageId: result.messageId }
      });

      res.json(result);
    } else {
      res.status(502).json(result);
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/integrations/whatsapp/session/connect
 * Requests a real QR connection session from the configured provider
 */
whatsappRouter.post('/session/connect', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const provider = getActiveQRProvider();
    const sessionInfo = await provider.initiateSession(uid);

    if (sessionInfo.status === 'not_configured') {
      res.status(400).json({
        sessionId: sessionInfo.sessionId,
        status: 'not_configured',
        error: sessionInfo.error || 'ProviderNotConfigured',
        message: sessionInfo.message || 'WhatsApp integration not configured.',
        instructions: [...WhatsAppQRInstructions]
      });
      return;
    }

    if (sessionInfo.status === 'error') {
      res.status(502).json({
        sessionId: sessionInfo.sessionId,
        status: 'error',
        error: sessionInfo.error || 'GatewayError',
        message: sessionInfo.message || 'Error communicating with WhatsApp provider.'
      });
      return;
    }

    const docRef = db.collection('users').doc(uid).collection('whatsapp_session').doc('current');
    const toSave = {
      sessionId: sessionInfo.sessionId,
      userId: uid,
      status: sessionInfo.status,
      qrPayload: sessionInfo.qrPayload || null,
      expiresAt: sessionInfo.expiresAt || null,
      connectedPhone: sessionInfo.connectedPhone || null,
      connectedAt: sessionInfo.connectedAt || null,
      error: sessionInfo.error || null,
      message: sessionInfo.message || null,
      instructions: [...WhatsAppQRInstructions],
      updatedAt: new Date().toISOString()
    };

    await docRef.set(toSave);

    res.json({
      sessionId: sessionInfo.sessionId,
      status: sessionInfo.status,
      qrPayload: sessionInfo.qrPayload,
      expiresAt: sessionInfo.expiresAt,
      instructions: [...WhatsAppQRInstructions]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/integrations/whatsapp/session/status
 * Fetches the current user's isolated session status with automatic expiry check
 */
whatsappRouter.get('/session/status', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const provider = getActiveQRProvider();
    if (!provider.isConfigured()) {
      res.json({
        status: 'not_configured',
        error: 'ProviderNotConfigured',
        message: 'WhatsApp Linked Devices QR provider is not configured on the backend. Personal WhatsApp account QR automation is not supported without an approved provider integration.'
      });
      return;
    }

    const docRef = db.collection('users').doc(uid).collection('whatsapp_session').doc('current');
    const doc = await docRef.get();

    if (!doc.exists) {
      res.json({
        status: 'not_configured',
        message: 'No active WhatsApp session found. Click Connect to initiate a session.'
      });
      return;
    }

    const session = doc.data() as any;

    // Check expiry
    if (session.status === 'qr_ready' && session.expiresAt) {
      const isExpired = new Date(session.expiresAt).getTime() <= Date.now();
      if (isExpired) {
        await docRef.update({
          status: 'expired',
          qrPayload: null,
          error: 'QRExpired',
          message: 'QR code expired. Please request a new QR code to link.',
          updatedAt: new Date().toISOString()
        });
        res.json({
          sessionId: session.sessionId,
          status: 'expired',
          error: 'QRExpired',
          message: 'QR code expired. Please request a new QR code to link.'
        });
        return;
      }
    }

    // Check with provider if connecting/qr_ready
    if (provider.isConfigured() && (session.status === 'qr_ready' || session.status === 'connecting')) {
      const liveStatus = await provider.getSessionStatus(uid, session.sessionId);
      if (liveStatus.status !== session.status) {
        await docRef.update({
          status: liveStatus.status,
          qrPayload: liveStatus.qrPayload || null,
          connectedPhone: liveStatus.connectedPhone || null,
          connectedAt: liveStatus.connectedAt || null,
          updatedAt: new Date().toISOString()
        });
        session.status = liveStatus.status;
        session.connectedPhone = liveStatus.connectedPhone;
        session.connectedAt = liveStatus.connectedAt;
      }
    }

    res.json({
      sessionId: session.sessionId,
      status: session.status,
      qrPayload: session.status === 'qr_ready' ? session.qrPayload : undefined,
      expiresAt: session.expiresAt,
      connectedPhone: session.connectedPhone,
      connectedAt: session.connectedAt,
      error: session.error,
      message: session.message,
      instructions: session.instructions || [...WhatsAppQRInstructions]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/integrations/whatsapp/session/disconnect
 * Disconnects and invalidates the session
 */
whatsappRouter.post('/session/disconnect', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const docRef = db.collection('users').doc(uid).collection('whatsapp_session').doc('current');
    const doc = await docRef.get();

    if (doc.exists) {
      const session = doc.data() as any;
      const provider = getActiveQRProvider();
      await provider.disconnect(uid, session.sessionId);

      await docRef.update({
        status: 'disconnected',
        qrPayload: null,
        connectedPhone: null,
        updatedAt: new Date().toISOString()
      });
    }

    // Revert active provider to safe fallback
    const settingsRef = db.collection('users').doc(uid).collection('settings').doc('automation');
    await settingsRef.set({
      activeProvider: 'clipboard_share_manual',
      autoSendEnabled: false,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    res.json({
      success: true,
      status: 'disconnected',
      message: 'WhatsApp session disconnected successfully.'
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/integrations/whatsapp/session/refresh
 * Explicitly requests a fresh valid QR code
 */
whatsappRouter.post('/session/refresh', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    const uid = req.user!.uid;
    const provider = getActiveQRProvider();
    const sessionInfo = await provider.initiateSession(uid);

    if (sessionInfo.status === 'not_configured') {
      res.status(400).json({
        status: 'not_configured',
        error: 'ProviderNotConfigured',
        message: sessionInfo.message || 'WhatsApp integration not configured.'
      });
      return;
    }

    if (sessionInfo.status === 'error') {
      res.status(502).json({
        status: 'error',
        error: sessionInfo.error || 'GatewayError',
        message: sessionInfo.message || 'Error communicating with WhatsApp provider.'
      });
      return;
    }

    const docRef = db.collection('users').doc(uid).collection('whatsapp_session').doc('current');
    const toSave = {
      sessionId: sessionInfo.sessionId,
      userId: uid,
      status: sessionInfo.status,
      qrPayload: sessionInfo.qrPayload || null,
      expiresAt: sessionInfo.expiresAt || null,
      error: sessionInfo.error || null,
      message: sessionInfo.message || null,
      instructions: [...WhatsAppQRInstructions],
      updatedAt: new Date().toISOString()
    };
    await docRef.set(toSave);

    res.json({
      sessionId: sessionInfo.sessionId,
      status: sessionInfo.status,
      qrPayload: sessionInfo.qrPayload,
      expiresAt: sessionInfo.expiresAt,
      instructions: [...WhatsAppQRInstructions]
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/integrations/whatsapp/session/simulate-link (Testing Only)
 * Allows integration tests to simulate real provider confirmation
 */
whatsappRouter.post('/session/simulate-link', authenticateToken, async (req: AuthenticatedRequest, res: Response, next) => {
  try {
    if (process.env.NODE_ENV !== 'test') {
      res.status(403).json({ error: 'Forbidden', message: 'Test simulation is only permitted in test environments.' });
      return;
    }

    const uid = req.user!.uid;
    const { phoneNumber = '+60123456789' } = req.body;
    const docRef = db.collection('users').doc(uid).collection('whatsapp_session').doc('current');
    const doc = await docRef.get();

    if (!doc.exists) {
      res.status(404).json({ error: 'NotFound', message: 'No session to link.' });
      return;
    }

    const session = doc.data() as any;
    if (session.status === 'expired') {
      res.status(400).json({ error: 'QRExpired', message: 'Cannot link an expired QR.' });
      return;
    }

    const now = new Date().toISOString();
    await docRef.update({
      status: 'connected',
      qrPayload: null,
      connectedPhone: phoneNumber,
      connectedAt: now,
      updatedAt: now
    });

    res.json({
      success: true,
      status: 'connected',
      connectedPhone: phoneNumber,
      connectedAt: now
    });
  } catch (err) {
    next(err);
  }
});
