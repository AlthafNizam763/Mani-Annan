import { WhatsAppProvider } from './whatsappProvider';
import { OfficialWhatsAppCloudProvider } from './officialCloudProvider';
import { ClipboardManualProvider } from './clipboardManualProvider';

export * from './whatsappProvider';
export * from './officialCloudProvider';
export * from './clipboardManualProvider';
export * from './qrProvider';

export const getWhatsAppProvider = (providerType: 'official_cloud_api' | 'clipboard_share_manual' | 'android_companion_listener'): WhatsAppProvider => {
  switch (providerType) {
    case 'official_cloud_api':
      return new OfficialWhatsAppCloudProvider();
    case 'clipboard_share_manual':
    default:
      return new ClipboardManualProvider();
  }
};
