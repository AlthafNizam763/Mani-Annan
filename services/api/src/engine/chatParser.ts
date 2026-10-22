export interface ChatMessage {
  timestamp?: string;
  sender: string;
  text: string;
  isOwner: boolean;
}

export interface ChatParseResult {
  ownerMessages: ChatMessage[];
  counterpartyMessages: ChatMessage[];
  totalParsed: number;
}

/**
 * Parses exported WhatsApp chat logs.
 * Supports standard timestamp formats:
 * - "[DD/MM/YY, HH:mm:ss] Sender: Message"
 * - "[MM/DD/YYYY, HH:mm AM/PM] Sender: Message"
 * - "DD/MM/YYYY, HH:mm - Sender: Message"
 * - "MM/DD/YY, HH:mm - Sender: Message"
 */
export const parseWhatsAppChat = (
  rawText: string,
  ownerIdentifier: string
): ChatParseResult => {
  const lines = rawText.split(/\r?\n/);
  const messages: ChatMessage[] = [];
  const normalizedOwner = ownerIdentifier.trim().toLowerCase();

  // Regex patterns for WhatsApp message headers
  const bracketPattern = /^\[(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\]\s*([^:]+):\s*(.*)$/;
  const dashPattern = /^(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4},\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s*-\s*([^:]+):\s*(.*)$/;

  let currentMessage: ChatMessage | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip WhatsApp system notifications
    if (
      trimmed.includes('Messages and calls are end-to-end encrypted') ||
      trimmed.includes('<Media omitted>') ||
      trimmed.includes('omitted')
    ) {
      continue;
    }

    let match = trimmed.match(bracketPattern);
    if (!match) {
      match = trimmed.match(dashPattern);
    }

    if (match) {
      if (currentMessage) {
        messages.push(currentMessage);
      }
      const [, timestamp, senderRaw, text] = match;
      const sender = senderRaw.trim();
      const isOwner = sender.toLowerCase() === normalizedOwner || sender.toLowerCase().includes(normalizedOwner);

      currentMessage = {
        timestamp,
        sender,
        text: text.trim(),
        isOwner
      };
    } else if (currentMessage) {
      // Multi-line continuation
      currentMessage.text += `\n${trimmed}`;
    }
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  const ownerMessages = messages.filter(m => m.isOwner);
  const counterpartyMessages = messages.filter(m => !m.isOwner);

  return {
    ownerMessages,
    counterpartyMessages,
    totalParsed: messages.length
  };
};
