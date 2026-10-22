import { Contact, SafetyCheckResult, SafetyRiskFlag } from '@project-echo/contracts';

// Keywords and patterns for deterministic inspection
const FINANCIAL_PATTERNS = [
  /\b(transfer|send money|pay me|banking|bank account|duitnow|venmo|zelle|paypal|credit card|cvv|iban)\b/i,
  /[$€£₹¥]|RM\s*\d+/i
];

const CREDENTIAL_PATTERNS = [
  /\b(otp|one-time password|password|pin code|security code|2fa|login token)\b/i,
  /\b\d{4,8}\s*(is your (code|otp|pin))\b/i
];

const EMERGENCY_PATTERNS = [
  /\b(hospital|emergency room|ambulance|suicide|self-harm|heart attack|police)\b/i
];

const COMMITMENT_PATTERNS = [
  /\b(i promise|i guarantee|contractually|i will transfer|signing now)\b/i
];

export interface PolicyEvaluationInput {
  contact: Contact;
  incomingMessage: string;
  generatedReply?: string;
}

export const evaluateDeterministicPolicies = (
  input: PolicyEvaluationInput
): SafetyCheckResult => {
  const { contact, incomingMessage, generatedReply } = input;
  const flags: SafetyRiskFlag[] = [];
  const combinedText = `${incomingMessage} ${generatedReply || ''}`;

  // 1. Check contact paused state
  if (contact.isPaused) {
    flags.push('contact_paused');
    return {
      isSafe: false,
      requiresManualReview: true,
      riskFlags: flags,
      reason: `Contact "${contact.name}" is currently paused by the owner.`
    };
  }

  // 2. Check Financial Request / Transfer
  for (const pattern of FINANCIAL_PATTERNS) {
    if (pattern.test(combinedText)) {
      flags.push('financial_commitment');
      break;
    }
  }

  // 3. Check Credential & PII Leakage
  for (const pattern of CREDENTIAL_PATTERNS) {
    if (pattern.test(combinedText)) {
      flags.push('credential_pii_detected');
      break;
    }
  }

  // 4. Check Emergency & Distress
  for (const pattern of EMERGENCY_PATTERNS) {
    if (pattern.test(combinedText)) {
      flags.push('urgent_emotional_distress');
      break;
    }
  }

  // 5. Check Factual Promises & Commitments
  if (generatedReply) {
    for (const pattern of COMMITMENT_PATTERNS) {
      if (pattern.test(generatedReply)) {
        flags.push('unknown_fact_hallucination_risk');
        break;
      }
    }
  }

  // 6. Check Quiet Hours
  if (contact.quietHours.enabled) {
    const isQuiet = checkQuietHours(contact.quietHours.start, contact.quietHours.end);
    if (isQuiet) {
      flags.push('quiet_hours_active');
    }
  }

  // Fail-closed determination
  const requiresManualReview = flags.length > 0 || !contact.autoSendEnabled;
  const isSafe = !flags.includes('financial_commitment') &&
                 !flags.includes('credential_pii_detected') &&
                 !flags.includes('urgent_emotional_distress');

  const reason = flags.length > 0
    ? `Flagged for review due to: ${flags.join(', ')}`
    : 'Passed all deterministic safety policies.';

  return {
    isSafe,
    requiresManualReview,
    riskFlags: flags,
    reason
  };
};

/**
 * Checks if current time is within HH:mm start and end range
 */
export const checkQuietHours = (start: string, end: string): boolean => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }
  // Overnight range (e.g. 22:00 to 08:00)
  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
};
