import {
  WhatsAppProvider,
  ProviderCapability,
  OutboundMessageResult,
  InboundMessageEvent
} from './whatsappProvider';
import crypto from 'crypto';

export class OfficialWhatsAppCloudProvider implements WhatsAppProvider {
  public readonly providerType = 'official_cloud_api' as const;

  private token?: string;
  private phoneNumberId?: string;
  private appSecret?: string;

  constructor() {
    this.token = process.env.META_WHATSAPP_TOKEN;
    this.phoneNumberId = process.env.META_PHONE_NUMBER_ID;
    this.appSecret = process.env.META_APP_SECRET;
  }

  async getCapabilities(): Promise<ProviderCapability> {
    const hasCreds = Boolean(this.token && this.phoneNumberId);
    return {
      providerType: this.providerType,
      displayName: 'Official Meta WhatsApp Business Cloud API',
      isAvailable: hasCreds,
      blockReason: hasCreds
        ? undefined
        : 'Missing META_WHATSAPP_TOKEN or META_PHONE_NUMBER_ID in server environment. Requires official Meta Business account and dedicated number.',
      canReceiveInbound: true,
      canSendOutbound: true,
      worksWithPersonalWhatsApp: false, // Incompatible with personal WhatsApp app on same number
      worksWhenDashboardClosed: true
    };
  }

  verifyWebhook(signature: string, rawBody: string): boolean {
    if (!this.appSecret) {
      // If secret is not set, reject in production
      return false;
    }
    try {
      const expected = crypto
        .createHmac('sha256', this.appSecret)
        .update(rawBody)
        .digest('hex');
      const prefix = 'sha256=';
      const sigWithoutPrefix = signature.startsWith(prefix) ? signature.slice(prefix.length) : signature;
      return crypto.timingSafeEqual(Buffer.from(sigWithoutPrefix), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  parseWebhookEvent(body: any): InboundMessageEvent[] {
    const events: InboundMessageEvent[] = [];
    if (!body || body.object !== 'whatsapp_business_account') {
      return events;
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === 'messages') {
          const value = change.value || {};
          const contacts = value.contacts || [];
          const contactName = contacts[0]?.profile?.name;
          const messages = value.messages || [];

          for (const msg of messages) {
            if (msg.type === 'text' && msg.text?.body) {
              events.push({
                messageId: msg.id,
                from: msg.from,
                senderName: contactName,
                timestamp: msg.timestamp ? new Date(parseInt(msg.timestamp, 10) * 1000).toISOString() : new Date().toISOString(),
                text: msg.text.body,
                rawPayload: msg
              });
            }
          }
        }
      }
    }

    return events;
  }

  async sendMessage(to: string, text: string): Promise<OutboundMessageResult> {
    if (!this.token || !this.phoneNumberId) {
      return {
        success: false,
        status: 'blocked',
        error: 'Meta WhatsApp credentials missing. Configure META_WHATSAPP_TOKEN and META_PHONE_NUMBER_ID.'
      };
    }

    try {
      const url = `https://graph.facebook.com/v20.0/${this.phoneNumberId}/messages`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to,
          type: 'text',
          text: { preview_url: false, body: text }
        })
      });

      const data = await response.json() as any;

      if (!response.ok) {
        return {
          success: false,
          status: 'failed',
          error: data.error?.message || 'Failed to send WhatsApp message via Meta Cloud API'
        };
      }

      const messageId = data.messages?.[0]?.id;
      return {
        success: true,
        messageId,
        status: 'sent'
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'failed',
        error: err.message
      };
    }
  }
}
