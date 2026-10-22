export interface QRSessionInfo {
  sessionId: string;
  userId: string;
  status: 'not_configured' | 'connecting' | 'qr_ready' | 'connected' | 'expired' | 'disconnected' | 'error';
  qrPayload?: string;
  expiresAt?: string;
  connectedPhone?: string;
  connectedAt?: string;
  error?: string;
  message?: string;
}

export interface WhatsAppQRProvider {
  readonly name: string;
  isConfigured(): boolean;
  initiateSession(userId: string): Promise<QRSessionInfo>;
  getSessionStatus(userId: string, sessionId: string): Promise<QRSessionInfo>;
  disconnect(userId: string, sessionId: string): Promise<void>;
  simulateConfirmLinked?(userId: string, sessionId: string, phone: string): Promise<QRSessionInfo>;
}

/**
 * Default QR Provider: Checks for configured gateway credentials.
 * If none are configured, safely reports unconfigured without inventing fake QRs.
 */
export class DefaultWhatsAppQRProvider implements WhatsAppQRProvider {
  readonly name = 'DefaultWhatsAppQRProvider';

  isConfigured(): boolean {
    return Boolean(process.env.WHATSAPP_QR_GATEWAY_URL && process.env.WHATSAPP_QR_GATEWAY_KEY);
  }

  async initiateSession(userId: string): Promise<QRSessionInfo> {
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
    const gatewayUrl = process.env.WHATSAPP_QR_GATEWAY_URL!;
    const apiKey = process.env.WHATSAPP_QR_GATEWAY_KEY!;

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

      const data = await response.json() as any;
      return {
        sessionId: data.sessionId,
        userId,
        status: 'qr_ready',
        qrPayload: data.qrPayload,
        expiresAt: data.expiresAt || new Date(Date.now() + 60000).toISOString()
      };
    } catch (err: any) {
      return {
        sessionId: `err_${Date.now()}`,
        userId,
        status: 'error',
        error: 'GatewayConnectionFailed',
        message: `Failed to connect to configured WhatsApp QR gateway: ${err.message}`
      };
    }
  }

  async getSessionStatus(userId: string, sessionId: string): Promise<QRSessionInfo> {
    if (!this.isConfigured()) {
      return {
        sessionId,
        userId,
        status: 'not_configured',
        error: 'ProviderNotConfigured',
        message: 'WhatsApp Linked Devices QR provider is not configured.'
      };
    }

    const gatewayUrl = process.env.WHATSAPP_QR_GATEWAY_URL!;
    const apiKey = process.env.WHATSAPP_QR_GATEWAY_KEY!;

    const response = await fetch(`${gatewayUrl}/session/status?sessionId=${encodeURIComponent(sessionId)}&userId=${encodeURIComponent(userId)}`, {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    const data = await response.json() as any;
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

  async disconnect(userId: string, sessionId: string): Promise<void> {
    if (!this.isConfigured()) return;
    const gatewayUrl = process.env.WHATSAPP_QR_GATEWAY_URL!;
    const apiKey = process.env.WHATSAPP_QR_GATEWAY_KEY!;

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

// Global provider registry for switching or injecting providers during runtime/testing
let activeQRProvider: WhatsAppQRProvider = new DefaultWhatsAppQRProvider();

export const getActiveQRProvider = (): WhatsAppQRProvider => activeQRProvider;

export const setCustomQRProvider = (provider: WhatsAppQRProvider | null): void => {
  activeQRProvider = provider || new DefaultWhatsAppQRProvider();
};
