"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiLLMProvider = void 0;
const generative_ai_1 = require("@google/generative-ai");
const config_1 = require("../config");
class GeminiLLMProvider {
    providerName = 'gemini';
    client;
    modelName;
    constructor(apiKey, modelName) {
        const key = apiKey || config_1.config.llm.geminiApiKey;
        if (!key) {
            console.warn('[GeminiLLMProvider] Warning: GEMINI_API_KEY is not set.');
        }
        this.client = new generative_ai_1.GoogleGenerativeAI(key || 'dummy_key');
        this.modelName = modelName || config_1.config.llm.geminiModel;
    }
    async generateReply(context) {
        const key = config_1.config.llm.geminiApiKey;
        if (!key || key === 'dummy_key') {
            throw new Error('[GeminiLLMProvider] GEMINI_API_KEY is not configured on the backend. Please set the GEMINI_API_KEY environment variable on Render.');
        }
        const model = this.client.getGenerativeModel({
            model: this.modelName,
            generationConfig: {
                temperature: 0.65,
                maxOutputTokens: 256
            }
        });
        const systemPrompt = this.buildPrompt(context);
        try {
            const response = await model.generateContent(systemPrompt);
            const text = response.response.text().trim();
            // Clean wrapping quotes if returned
            const cleanReply = text.replace(/^["']|["']$/g, '');
            return {
                replyText: cleanReply,
                modelUsed: this.modelName,
                isRealAI: true,
                usage: {
                    totalTokens: response.response.usageMetadata?.totalTokenCount
                }
            };
        }
        catch (err) {
            throw new Error(`[GeminiLLMProvider Error]: ${err.message}`);
        }
    }
    buildPrompt(ctx) {
        const style = ctx.ownerStyle;
        const contact = ctx.contact;
        return `You are acting as an authentic AI personal messaging assistant for the owner.
Your objective is to generate an authentic, natural reply to an incoming message from a contact.

### CRITICAL RULES:
1. Speak strictly in the owner's authentic voice, tone, and messaging habits.
2. The contact relationship is "${contact.relationship}" and preferred tone is "${contact.preferredTone}".
3. Adhere to style cues:
   - Primary languages: ${style.primaryLanguages.join(', ')} (supports English, Malayalam / Manglish transliteration, and regional slang naturally)
   - Uses Manglish / Regional Slang: ${style.usesManglish ? 'YES' : 'NO'}
   - Common slang words: ${style.commonSlang.join(', ')}
   - Average sentence length: ${style.avgSentenceLength}
   - Punctuation habits: ${style.punctuationHabits.omitsEndingPeriod ? 'Usually omits trailing period.' : 'Standard periods.'} ${style.punctuationHabits.usesEllipsis ? 'Frequently uses ellipsis (...).' : ''}
   - Emoji habits: ${style.emojiHabits.emojiFrequency} frequency. Top emojis: ${style.emojiHabits.frequentEmojis.join(' ')}
4. NEVER invent factual promises, monetary transfers, specific schedules you do not know, or sensitive claims.
5. If context is missing, produce a safe clarification or brief, realistic acknowledgment.
6. Output ONLY the raw reply message text. Do not wrap in quotes or add commentary.

### AUTHENTIC OWNER EXAMPLES:
${ctx.relevantExamples.map((ex, idx) => `Example ${idx + 1}: ${ex}`).join('\n') || 'None provided.'}

${ctx.optionalContext ? `### ADDITIONAL CONTEXT FROM OWNER:\n${ctx.optionalContext}\n` : ''}

### INCOMING MESSAGE FROM "${contact.name}":
"""${ctx.incomingMessage}"""

REPLY:`;
    }
}
exports.GeminiLLMProvider = GeminiLLMProvider;
