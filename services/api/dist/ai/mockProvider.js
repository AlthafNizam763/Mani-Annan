"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockLLMProvider = void 0;
class MockLLMProvider {
    providerName = 'mock';
    async generateReply(context) {
        const { contact, incomingMessage, ownerStyle } = context;
        const lowerMsg = incomingMessage.toLowerCase();
        // Check relationship specifics
        if (contact.relationship === 'romantic_partner') {
            const emoji = ownerStyle.emojiHabits.frequentEmojis[0] || '❤️';
            return {
                replyText: `Hey love, got your message! Talk soon ${emoji}`,
                modelUsed: 'mock-engine-v1',
                isRealAI: false
            };
        }
        if (contact.relationship === 'boss_or_manager') {
            return {
                replyText: `Noted, will review this and update you shortly. Thank you.`,
                modelUsed: 'mock-engine-v1',
                isRealAI: false
            };
        }
        // Default friendly / Manglish reply
        const slang = ownerStyle.commonSlang.length > 0 ? ` ${ownerStyle.commonSlang[0]}` : '';
        const emoji = ownerStyle.emojiHabits.frequentEmojis.length > 0 ? ` ${ownerStyle.emojiHabits.frequentEmojis[0]}` : ' 👍';
        if (lowerMsg.includes('free') || lowerMsg.includes('meeting') || lowerMsg.includes('cafe')) {
            return {
                replyText: `Yeah on for that${slang}! Let's meet up${emoji}`,
                modelUsed: 'mock-engine-v1',
                isRealAI: false
            };
        }
        return {
            replyText: `Got it${slang}, let me check and get back to you${emoji}`,
            modelUsed: 'mock-engine-v1',
            isRealAI: false
        };
    }
}
exports.MockLLMProvider = MockLLMProvider;
