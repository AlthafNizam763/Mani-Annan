"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfficialWhatsAppCloudProvider = void 0;
const crypto_1 = __importDefault(require("crypto"));
class OfficialWhatsAppCloudProvider {
    providerType = 'official_cloud_api';
    token;
    phoneNumberId;
    appSecret;
    constructor() {
        this.token = process.env.META_WHATSAPP_TOKEN;
        this.phoneNumberId = process.env.META_PHONE_NUMBER_ID;
        this.appSecret = process.env.META_APP_SECRET;
    }
    async getCapabilities() {
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
    verifyWebhook(signature, rawBody) {
        if (!this.appSecret) {
            // If secret is not set, reject in production
            return false;
        }
        try {
            const expected = crypto_1.default
                .createHmac('sha256', this.appSecret)
                .update(rawBody)
                .digest('hex');
            const prefix = 'sha256=';
            const sigWithoutPrefix = signature.startsWith(prefix) ? signature.slice(prefix.length) : signature;
            return crypto_1.default.timingSafeEqual(Buffer.from(sigWithoutPrefix), Buffer.from(expected));
        }
        catch {
            return false;
        }
    }
    parseWebhookEvent(body) {
        const events = [];
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
    async sendMessage(to, text) {
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
            const data = await response.json();
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
        }
        catch (err) {
            return {
                success: false,
                status: 'failed',
                error: err.message
            };
        }
    }
}
exports.OfficialWhatsAppCloudProvider = OfficialWhatsAppCloudProvider;
