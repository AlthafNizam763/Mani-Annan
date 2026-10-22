import { parseWhatsAppChat } from '../engine/chatParser';
import { extractStyleProfile } from '../engine/styleExtractor';
import { evaluateDeterministicPolicies } from '../engine/policyEngine';
import { Contact } from '@project-echo/contracts';

describe('Chat Parser & Owner Message Separation', () => {
  const sampleChat = `
[10/14/26, 09:15:00] Alex: Yo bro you free today?
[10/14/26, 09:16:12] Sam: Free after 5pm
[10/14/26, 09:17:00] Alex: Ok deal, see you at café lah...
[10/14/26, 09:18:00] Sam: Sounds good 👍
[10/14/26, 09:19:00] Alex: Steady bro!
`;

  it('separates owner outgoing messages from incoming contact messages', () => {
    const result = parseWhatsAppChat(sampleChat, 'Alex');

    expect(result.ownerMessages.length).toBe(3);
    expect(result.counterpartyMessages.length).toBe(2);

    expect(result.ownerMessages[0].text).toBe('Yo bro you free today?');
    expect(result.ownerMessages[1].text).toBe('Ok deal, see you at café lah...');
    expect(result.ownerMessages[2].text).toBe('Steady bro!');

    expect(result.counterpartyMessages[0].text).toBe('Free after 5pm');
    expect(result.counterpartyMessages[1].text).toBe('Sounds good 👍');
  });

  it('never incorporates counterparty messages into style profile extraction', () => {
    const parsed = parseWhatsAppChat(sampleChat, 'Alex');
    const profile = extractStyleProfile(parsed.ownerMessages);

    // Alex used 'lah', 'bro', 'steady', ellipsis '...'
    expect(profile.usesManglish).toBe(true);
    expect(profile.commonSlang).toContain('bro');
    expect(profile.commonSlang).toContain('lah');
    expect(profile.punctuationHabits.usesEllipsis).toBe(true);
  });
});

describe('Deterministic Policy & Safety Engine', () => {
  const mockContact: Contact = {
    id: 'contact_1',
    name: 'Boss John',
    relationship: 'boss_or_manager',
    preferredTone: 'professional',
    allowedCategories: ['general_chat', 'work_tasks'],
    autoSendEnabled: false,
    quietHours: { enabled: false, start: '22:00', end: '08:00', timezone: 'UTC' },
    sensitiveTopicsRequireReview: true,
    isPaused: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('flags financial transfer requests for mandatory manual review', () => {
    const check = evaluateDeterministicPolicies({
      contact: mockContact,
      incomingMessage: 'Can you please transfer $500 to my account immediately?',
      generatedReply: 'Sure, I will send money now'
    });

    expect(check.isSafe).toBe(false);
    expect(check.requiresManualReview).toBe(true);
    expect(check.riskFlags).toContain('financial_commitment');
  });

  it('flags OTP and password requests', () => {
    const check = evaluateDeterministicPolicies({
      contact: mockContact,
      incomingMessage: 'What is your OTP code for login?',
      generatedReply: 'My code is 123456'
    });

    expect(check.isSafe).toBe(false);
    expect(check.requiresManualReview).toBe(true);
    expect(check.riskFlags).toContain('credential_pii_detected');
  });

  it('flags paused contacts immediately', () => {
    const pausedContact = { ...mockContact, isPaused: true };
    const check = evaluateDeterministicPolicies({
      contact: pausedContact,
      incomingMessage: 'Hello there',
      generatedReply: 'Hi John'
    });

    expect(check.isSafe).toBe(false);
    expect(check.requiresManualReview).toBe(true);
    expect(check.riskFlags).toContain('contact_paused');
  });

  it('passes safe ordinary messages but enforces review when autoSendEnabled is false', () => {
    const check = evaluateDeterministicPolicies({
      contact: mockContact,
      incomingMessage: 'Did you finish the slide deck?',
      generatedReply: 'Working on it now, will share in 30 mins.'
    });

    expect(check.isSafe).toBe(true);
    // Auto-send is false by default, so review is safely maintained
    expect(check.requiresManualReview).toBe(true);
    expect(check.riskFlags).toHaveLength(0);
  });
});
