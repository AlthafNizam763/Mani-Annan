"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCustomQRProvider = exports.getActiveQRProvider = exports.DefaultWhatsAppQRProvider = void 0;
/**
 * Default QR Provider: Checks for configured gateway credentials.
 * If none are configured, safely reports unconfigured without inventing fake QRs.
 */
class DefaultWhatsAppQRProvider {
    name = 'DefaultWhatsAppQRProvider';
    isConfigured() {
        return Boolean(process.env.WHATSAPP_QR_GATEWAY_URL && process.env.WHATSAPP_QR_GATEWAY_KEY);
    }
    async initiateSession(userId) {
        if (!this.isConfigured()) {
            return {
                sessionId: `unconfigured_${userId}`,
                userId,
                status: 'not_configured',
                error: 'ProviderNotConfigured',
                message: 'WhatsApp Linked Devices QR provider is not configured on the backend. Personal WhatsApp account QR automation is not supported without an approved provider integration. Unofficial scraping is strictly disabled.'
            };
        }
        // Call real external configured gateway if environment variables are present
        const gatewayUrl = process.env.WHATSAPP_QR_GATEWAY_URL;
        const apiKey = process.env.WHATSAPP_QR_GATEWAY_KEY;
        try {
            const response = await fetch(`${gatewayUrl}/session/initiate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({ userId })
            });
            if (!response.ok) {
                throw new Error(`Gateway returned status ${response.status}`);
            }
            const data = await response.json();
            return {
                sessionId: data.sessionId,
                userId,
                status: 'qr_ready',
                qrPayload: data.qrPayload,
                expiresAt: data.expiresAt || new Date(Date.now() + 60000).toISOString()
            };
        }
        catch (err) {
            return {
                sessionId: `err_${Date.now()}`,
                userId,
                status: 'error',
                error: 'GatewayConnectionFailed',
                message: `Failed to connect to configured WhatsApp QR gateway: ${err.message}`
            };
        }
    }
    async getSessionStatus(userId, sessionId) {
        if (!this.isConfigured()) {
            return {
                sessionId,
                userId,
                status: 'not_configured',
                error: 'ProviderNotConfigured',
                message: 'WhatsApp Linked Devices QR provider is not configured.'
            };
        }
        const gatewayUrl = process.env.WHATSAPP_QR_GATEWAY_URL;
        const apiKey = process.env.WHATSAPP_QR_GATEWAY_KEY;
        const response = await fetch(`${gatewayUrl}/session/status?sessionId=${encodeURIComponent(sessionId)}&userId=${encodeURIComponent(userId)}`, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await response.json();
        return {
            sessionId,
            userId,
            status: data.status,
            qrPayload: data.qrPayload,
            expiresAt: data.expiresAt,
            connectedPhone: data.connectedPhone,
            connectedAt: data.connectedAt,
            error: data.error,
            message: data.message
        };
    }
    async disconnect(userId, sessionId) {
        if (!this.isConfigured())
            return;
        const gatewayUrl = process.env.WHATSAPP_QR_GATEWAY_URL;
        const apiKey = process.env.WHATSAPP_QR_GATEWAY_KEY;
        await fetch(`${gatewayUrl}/session/disconnect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({ userId, sessionId })
        });
    }
}
exports.DefaultWhatsAppQRProvider = DefaultWhatsAppQRProvider;
// Global provider registry for switching or injecting providers during runtime/testing
let activeQRProvider = new DefaultWhatsAppQRProvider();
const getActiveQRProvider = () => activeQRProvider;
exports.getActiveQRProvider = getActiveQRProvider;
const setCustomQRProvider = (provider) => {
    activeQRProvider = provider || new DefaultWhatsAppQRProvider();
};
exports.setCustomQRProvider = setCustomQRProvider;
