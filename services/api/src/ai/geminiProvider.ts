import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMProvider, ReplyContext, ReplyResult } from './llmProvider';
import { config } from '../config';

export class GeminiLLMProvider implements LLMProvider {
  public readonly providerName = 'gemini';
  private client: GoogleGenerativeAI;
  private modelName: string;

  constructor(apiKey?: string, modelName?: string) {
    const key = apiKey || config.llm.geminiApiKey;
    if (!key) {
      console.warn('[GeminiLLMProvider] Warning: GEMINI_API_KEY is not set.');
    }
    this.client = new GoogleGenerativeAI(key || 'dummy_key');
    this.modelName = modelName || config.llm.geminiModel;
  }

  async generateReply(context: ReplyContext): Promise<ReplyResult> {
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
    } catch (err: any) {
      throw new Error(`[GeminiLLMProvider Error]: ${err.message}`);
    }
  }

  private buildPrompt(ctx: ReplyContext): string {
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
