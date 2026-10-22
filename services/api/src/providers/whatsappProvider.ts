export interface InboundMessageEvent {
  messageId: string;
  from: string; // phone number or sender ID
  senderName?: string;
  timestamp: string;
  text: string;
  rawPayload?: any;
}

export interface OutboundMessageResult {
  success: boolean;
  messageId?: string;
  status: 'sent' | 'delivered' | 'failed' | 'blocked';
  error?: string;
}

export interface ProviderCapability {
  providerType: 'official_cloud_api' | 'android_companion_listener' | 'clipboard_share_manual' | 'linked_devices_qr_personal';
  displayName: string;
  isAvailable: boolean;
  blockReason?: string;
  canReceiveInbound: boolean;
  canSendOutbound: boolean;
  worksWithPersonalWhatsApp: boolean;
  worksWhenDashboardClosed: boolean;
}

export interface WhatsAppProvider {
  readonly providerType: 'official_cloud_api' | 'android_companion_listener' | 'clipboard_share_manual' | 'linked_devices_qr_personal';
  getCapabilities(): Promise<ProviderCapability>;
  sendMessage(to: string, text: string): Promise<OutboundMessageResult>;
  verifyWebhook(signature: string, rawBody: string): boolean;
  parseWebhookEvent(body: any): InboundMessageEvent[];
}
