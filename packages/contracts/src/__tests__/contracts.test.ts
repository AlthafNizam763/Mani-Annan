import {
  ContactSchema,
  CreateContactRequestSchema,
  StyleProfileSchema,
  ImportChatRequestSchema,
  GenerateReplyRequestSchema,
  SafetyCheckResultSchema,
  AutomationSettingsSchema,
  WhatsAppCapabilityReportSchema,
  WhatsAppConnectionSessionSchema,
  WhatsAppConnectResponseSchema
} from '../index';

describe('Contracts Schema Validation', () => {
  it('validates a valid Contact', () => {
    const validContact = {
      id: 'c123',
      name: 'Sarah',
      relationship: 'romantic_partner',
      preferredTone: 'warm_and_affectionate',
      allowedCategories: ['general_chat'],
      autoSendEnabled: false,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '08:00',
        timezone: 'Asia/Kuala_Lumpur'
      },
      sensitiveTopicsRequireReview: true,
      isPaused: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const parsed = ContactSchema.parse(validContact);
    expect(parsed.name).toBe('Sarah');
    expect(parsed.autoSendEnabled).toBe(false);
  });

  it('enforces mandatory explicit consent on Chat Import', () => {
    const invalidImport = {
      rawText: 'Alex: Hello\nSam: Hi',
      ownerIdentifier: 'Alex',
      consentConfirmed: false
    };
    expect(() => ImportChatRequestSchema.parse(invalidImport)).toThrow();

    const validImport = {
      rawText: 'Alex: Hello\nSam: Hi',
      ownerIdentifier: 'Alex',
      consentConfirmed: true
    };
    const parsed = ImportChatRequestSchema.parse(validImport);
    expect(parsed.consentConfirmed).toBe(true);
  });

  it('validates AutomationSettings with fail-closed defaults', () => {
    const defaultSettings = AutomationSettingsSchema.parse({});
    expect(defaultSettings.maniGlobalEnabled).toBe(false);
    expect(defaultSettings.autoSendEnabled).toBe(false);
    expect(defaultSettings.emergencyStop).toBe(false);
    expect(defaultSettings.activeProvider).toBe('clipboard_share_manual');
  });

  it('validates SafetyCheckResult risk flags', () => {
    const safety = SafetyCheckResultSchema.parse({
      isSafe: false,
      requiresManualReview: true,
      riskFlags: ['financial_commitment', 'credential_pii_detected'],
      reason: 'Contains monetary transfer request'
    });
    expect(safety.isSafe).toBe(false);
    expect(safety.requiresManualReview).toBe(true);
    expect(safety.riskFlags).toContain('financial_commitment');
  });

  it('validates WhatsAppCapabilityReport structure', () => {
    const report = WhatsAppCapabilityReportSchema.parse({
      accountType: 'normal_personal_whatsapp',
      canAutoReplyWithDashboardClosed: false,
      supportedProviders: [
        {
          provider: 'clipboard_share_manual',
          displayName: 'OS Share & Clipboard',
          description: 'Safe human-in-the-loop workflow',
          status: 'connected_active',
          worksWhenDashboardClosed: false,
          requiresDedicatedNumber: false,
          riskAssessment: 'Zero ban risk.'
        }
      ]
    });
    expect(report.accountType).toBe('normal_personal_whatsapp');
    expect(report.canAutoReplyWithDashboardClosed).toBe(false);
  });

  it('validates WhatsAppConnectionSession and QR states', () => {
    const session = WhatsAppConnectionSessionSchema.parse({
      sessionId: 'sess_123',
      userId: 'user_alpha',
      status: 'qr_ready',
      qrPayload: '1@abcd1234efgh,5678,9012',
      expiresAt: new Date(Date.now() + 60000).toISOString(),
      updatedAt: new Date().toISOString()
    });
    expect(session.status).toBe('qr_ready');
    expect(session.instructions.length).toBeGreaterThan(0);
    expect(session.instructions[0]).toContain('Open WhatsApp');

    const notConfigured = WhatsAppConnectResponseSchema.parse({
      status: 'not_configured',
      error: 'ProviderNotConfigured',
      message: 'WhatsApp Linked Devices QR provider is not configured.'
    });
    expect(notConfigured.status).toBe('not_configured');
    expect(notConfigured.qrPayload).toBeUndefined();
  });
});
