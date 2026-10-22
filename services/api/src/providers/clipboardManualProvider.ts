import {
  WhatsAppProvider,
  ProviderCapability,
  OutboundMessageResult,
  InboundMessageEvent
} from './whatsappProvider';

export class ClipboardManualProvider implements WhatsAppProvider {
  public readonly providerType = 'clipboard_share_manual' as const;

  async getCapabilities(): Promise<ProviderCapability> {
    return {
      providerType: this.providerType,
      displayName: 'OS Share & Clipboard (Human-in-the-Loop)',
      isAvailable: true,
      canReceiveInbound: false,
      canSendOutbound: true,
      worksWithPersonalWhatsApp: true,
      worksWhenDashboardClosed: false
    };
  }

  verifyWebhook(_signature: string, _rawBody: string): boolean {
    return false;
  }

  parseWebhookEvent(_body: any): InboundMessageEvent[] {
    return [];
  }

  async sendMessage(_to: string, _text: string): Promise<OutboundMessageResult> {
    // Clipboard / OS share operates on client side
    return {
      success: true,
      status: 'delivered'
    };
  }
}
