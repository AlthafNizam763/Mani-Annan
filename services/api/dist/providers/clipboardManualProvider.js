"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClipboardManualProvider = void 0;
class ClipboardManualProvider {
    providerType = 'clipboard_share_manual';
    async getCapabilities() {
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
    verifyWebhook(_signature, _rawBody) {
        return false;
    }
    parseWebhookEvent(_body) {
        return [];
    }
    async sendMessage(_to, _text) {
        // Clipboard / OS share operates on client side
        return {
            success: true,
            status: 'delivered'
        };
    }
}
exports.ClipboardManualProvider = ClipboardManualProvider;
