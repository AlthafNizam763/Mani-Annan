import { LLMProvider } from './llmProvider';
import { GeminiLLMProvider } from './geminiProvider';
import { MockLLMProvider } from './mockProvider';
import { config } from '../config';

export const getLLMProvider = (): LLMProvider => {
  if (config.llm.provider === 'gemini' && config.llm.geminiApiKey) {
    return new GeminiLLMProvider();
  }
  return new MockLLMProvider();
};
