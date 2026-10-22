import { Contact, StyleProfile } from '@project-echo/contracts';

export interface ReplyContext {
  ownerStyle: StyleProfile;
  contact: Contact;
  incomingMessage: string;
  relevantExamples: string[];
  optionalContext?: string;
}

export interface ReplyResult {
  replyText: string;
  modelUsed: string;
  isRealAI: boolean;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

export interface LLMProvider {
  readonly providerName: string;
  generateReply(context: ReplyContext): Promise<ReplyResult>;
}
