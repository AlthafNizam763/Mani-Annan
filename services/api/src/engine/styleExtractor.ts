import { StyleProfile } from '@project-echo/contracts';
import { ChatMessage } from './chatParser';

const MANGLISH_SLANG_WORDS = [
  'lah', 'lor', 'meh', 'leh', 'sia', 'dei', 'dey', 'machan', 'bro', 'boss',
  'walau', 'walao', 'alot', 'chup', 'tapau', 'kopi', 'makan', 'steady', 'on', 'ngam'
];

export const extractStyleProfile = (
  ownerMessages: ChatMessage[],
  existingProfile?: StyleProfile
): StyleProfile => {
  if (ownerMessages.length === 0) {
    return existingProfile || {
      version: 1,
      primaryLanguages: ['en'],
      usesManglish: false,
      commonSlang: [],
      avgSentenceLength: 'short',
      punctuationHabits: {
        multipleExclamations: false,
        usesEllipsis: false,
        omitsEndingPeriod: true,
        questionMarksOnlyWhenNeeded: true
      },
      emojiHabits: {
        frequentEmojis: [],
        emojiFrequency: 'minimal'
      },
      greetingStyle: 'casual',
      closingStyle: 'casual',
      updatedAt: new Date().toISOString()
    };
  }

  // 1. Analyze Slang & Manglish
  const detectedSlangCount = new Map<string, number>();
  let manglishHits = 0;
  let totalWords = 0;
  let totalExclamations = 0;
  let totalEllipses = 0;
  let totalPeriodsAtEnd = 0;

  // Regex to extract emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;
  const emojiCount = new Map<string, number>();
  let totalEmojis = 0;

  for (const msg of ownerMessages) {
    const text = msg.text;
    const words = text.toLowerCase().split(/\s+/);
    totalWords += words.length;

    for (const w of words) {
      const cleanWord = w.replace(/[^a-zA-Z]/g, '');
      if (MANGLISH_SLANG_WORDS.includes(cleanWord)) {
        manglishHits++;
        detectedSlangCount.set(cleanWord, (detectedSlangCount.get(cleanWord) || 0) + 1);
      }
    }

    if (text.includes('!!') || text.includes('! !')) totalExclamations++;
    if (text.includes('...') || text.includes('..')) totalEllipses++;
    if (text.trim().endsWith('.')) totalPeriodsAtEnd++;

    const foundEmojis = text.match(emojiRegex);
    if (foundEmojis) {
      for (const emoji of foundEmojis) {
        totalEmojis++;
        emojiCount.set(emoji, (emojiCount.get(emoji) || 0) + 1);
      }
    }
  }

  const commonSlang = Array.from(detectedSlangCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);

  const topEmojis = Array.from(emojiCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([emoji]) => emoji);

  const avgWordsPerMessage = totalWords / ownerMessages.length;
  let avgSentenceLength: 'short' | 'medium' | 'verbose' = 'short';
  if (avgWordsPerMessage > 20) {
    avgSentenceLength = 'verbose';
  } else if (avgWordsPerMessage > 9) {
    avgSentenceLength = 'medium';
  }

  let emojiFrequency: 'none' | 'minimal' | 'moderate' | 'heavy' = 'none';
  const emojiRate = totalEmojis / ownerMessages.length;
  if (emojiRate > 1.2) emojiFrequency = 'heavy';
  else if (emojiRate > 0.4) emojiFrequency = 'moderate';
  else if (emojiRate > 0) emojiFrequency = 'minimal';

  const omitsEndingPeriod = totalPeriodsAtEnd / ownerMessages.length < 0.4;
  const usesEllipsis = totalEllipses / ownerMessages.length > 0.15;
  const multipleExclamations = totalExclamations / ownerMessages.length > 0.15;

  return {
    version: (existingProfile?.version || 0) + 1,
    primaryLanguages: manglishHits > 0 ? ['en', 'manglish'] : ['en'],
    usesManglish: manglishHits > 0,
    commonSlang: commonSlang.length > 0 ? commonSlang : (existingProfile?.commonSlang || ['bro', 'lah']),
    avgSentenceLength,
    punctuationHabits: {
      multipleExclamations,
      usesEllipsis,
      omitsEndingPeriod,
      questionMarksOnlyWhenNeeded: true
    },
    emojiHabits: {
      frequentEmojis: topEmojis.length > 0 ? topEmojis : (existingProfile?.emojiHabits?.frequentEmojis || ['👍']),
      emojiFrequency
    },
    greetingStyle: avgSentenceLength === 'short' ? 'minimal/informal' : 'friendly',
    closingStyle: omitsEndingPeriod ? 'open/no-period' : 'standard',
    customInstructions: existingProfile?.customInstructions,
    updatedAt: new Date().toISOString()
  };
};
