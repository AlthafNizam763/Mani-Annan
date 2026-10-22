import { z } from 'zod';

// ==========================================
// 1. Enums & Literal Sets
// ==========================================
export const RelationshipCategorySchema = z.enum([
  'romantic_partner',
  'boss_or_manager',
  'friend',
  'family_member',
  'custom'
]);
export type RelationshipCategory = z.infer<typeof RelationshipCategorySchema>;

export const PreferredToneSchema = z.enum([
  'casual',
  'professional',
  'warm_and_affectionate',
  'respectful',
  'humorous_playful',
  'neutral_direct'
]);
export type PreferredTone = z.infer<typeof PreferredToneSchema>;

export const DraftReviewStatusSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'edited',
  'copied',
  'shared'
]);
export type DraftReviewStatus = z.infer<typeof DraftReviewStatusSchema>;

export const MessageCategorySchema = z.enum([
  'general_chat',
  'scheduling_plans',
  'work_tasks',
  'sensitive_personal',
  'financial_transfer',
  'urgent_emergency'
]);
export type MessageCategory = z.infer<typeof MessageCategorySchema>;

// ==========================================
// 2. Personal Writing Style Schema
// ==========================================
export const PunctuationHabitsSchema = z.object({
  multipleExclamations: z.boolean().default(false),
  usesEllipsis: z.boolean().default(true),
  omitsEndingPeriod: z.boolean().default(true),
  questionMarksOnlyWhenNeeded: z.boolean().default(true)
});

export const EmojiHabitsSchema = z.object({
  frequentEmojis: z.array(z.string()).default([]),
  emojiFrequency: z.enum(['none', 'minimal', 'moderate', 'heavy']).default('moderate')
});

export const StyleProfileSchema = z.object({
  version: z.number().default(1),
  primaryLanguages: z.array(z.string()).default(['en']),
  usesManglish: z.boolean().default(true),
  commonSlang: z.array(z.string()).default(['lah', 'bro', 'dey', 'machan', 'ok ok']),
  avgSentenceLength: z.enum(['short', 'medium', 'verbose']).default('short'),
  punctuationHabits: PunctuationHabitsSchema.default({}),
  emojiHabits: EmojiHabitsSchema.default({}),
  greetingStyle: z.string().default('informal'),
  closingStyle: z.string().default('casual'),
  customInstructions: z.string().optional(),
  updatedAt: z.string().datetime().optional()
});
export type StyleProfile = z.infer<typeof StyleProfileSchema>;

// ==========================================
// 3. User & Settings Schema
// ==========================================
export const UserProfileSchema = z.object({
  uid: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  createdAt: z.string().datetime(),
  styleProfile: StyleProfileSchema.optional()
});
export type UserProfile = z.infer<typeof UserProfileSchema>;

// ==========================================
// 4. Contact Schema
// ==========================================
export const QuietHoursSchema = z.object({
  enabled: z.boolean().default(false),
  start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('22:00'),
  end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('08:00'),
  timezone: z.string().default('UTC')
});

export const ContactSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Contact name is required'),
  phoneNumber: z.string().optional(),
  relationship: RelationshipCategorySchema.default('friend'),
  preferredTone: PreferredToneSchema.default('casual'),
  customRelationshipNotes: z.string().optional(),
  allowedCategories: z.array(MessageCategorySchema).default(['general_chat', 'scheduling_plans']),
  autoSendEnabled: z.boolean().default(false), // STRICT DEFAULT FALSE
  quietHours: QuietHoursSchema.default({}),
  sensitiveTopicsRequireReview: z.boolean().default(true),
  isPaused: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
export type Contact = z.infer<typeof ContactSchema>;

export const CreateContactRequestSchema = ContactSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
export type CreateContactRequest = z.infer<typeof CreateContactRequestSchema>;

export const UpdateContactRequestSchema = CreateContactRequestSchema.partial();
export type UpdateContactRequest = z.infer<typeof UpdateContactRequestSchema>;

// ==========================================
// 5. Authorized Chat Import Schema
// ==========================================
export const ImportChatRequestSchema = z.object({
  rawText: z.string().min(10, 'Chat export must contain valid text entries'),
  ownerIdentifier: z.string().min(1, 'Owner name or sender identifier is required'),
  contactName: z.string().optional(),
  consentConfirmed: z.literal(true, {
    errorMap: () => ({ message: 'Explicit user authorization and consent is mandatory to process chat history' })
  })
});
export type ImportChatRequest = z.infer<typeof ImportChatRequestSchema>;

export const ImportChatResultSchema = z.object({
  importId: z.string(),
  status: z.enum(['completed', 'failed', 'processing']),
  extractedOwnerMessagesCount: z.number(),
  extractedContactMessagesCount: z.number(),
  styleProfileUpdated: z.boolean(),
  detectedSlang: z.array(z.string()),
  summary: z.string()
});
export type ImportChatResult = z.infer<typeof ImportChatResultSchema>;

// ==========================================
// 6. Reply Generation & Deterministic Safety
// ==========================================
export const SafetyRiskFlagSchema = z.enum([
  'financial_commitment',
  'credential_pii_detected',
  'urgent_emotional_distress',
  'legal_medical_advice',
  'unknown_fact_hallucination_risk',
  'unauthorized_auto_send',
  'quiet_hours_active',
  'contact_paused'
]);
export type SafetyRiskFlag = z.infer<typeof SafetyRiskFlagSchema>;

export const SafetyCheckResultSchema = z.object({
  isSafe: z.boolean(),
  requiresManualReview: z.boolean(),
  riskFlags: z.array(SafetyRiskFlagSchema),
  reason: z.string()
});
export type SafetyCheckResult = z.infer<typeof SafetyCheckResultSchema>;

export const GenerateReplyRequestSchema = z.object({
  contactId: z.string().min(1, 'Contact ID is required'),
  incomingMessage: z.string().min(1, 'Incoming message cannot be empty'),
  optionalContext: z.string().optional()
});
export type GenerateReplyRequest = z.infer<typeof GenerateReplyRequestSchema>;

export const ReplyDraftSchema = z.object({
  id: z.string(),
  contactId: z.string(),
  contactName: z.string(),
  relationship: RelationshipCategorySchema,
  incomingMessage: z.string(),
  generatedReply: z.string(),
  editedReply: z.string().optional(),
  safetyCheck: SafetyCheckResultSchema,
  reviewStatus: DraftReviewStatusSchema.default('pending'),
  providerUsed: z.string().default('gemini'),
  createdAt: z.string().datetime(),
  reviewedAt: z.string().datetime().optional()
});
export type ReplyDraft = z.infer<typeof ReplyDraftSchema>;

export const UpdateDraftReviewRequestSchema = z.object({
  reviewStatus: DraftReviewStatusSchema,
  editedReply: z.string().optional()
});
export type UpdateDraftReviewRequest = z.infer<typeof UpdateDraftReviewRequestSchema>;

// ==========================================
// 7. Feedback & Continuous Learning Schema
// ==========================================
export const DraftFeedbackRequestSchema = z.object({
  draftId: z.string(),
  rating: z.enum(['helpful', 'needs_improvement', 'inaccurate_tone']),
  ownerCorrection: z.string().optional(),
  notes: z.string().optional()
});
export type DraftFeedbackRequest = z.infer<typeof DraftFeedbackRequestSchema>;

// ==========================================
// 8. Audit Event Schema
// ==========================================
export const AuditEventSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  eventType: z.enum([
    'import_chat',
    'generate_reply',
    'draft_approved',
    'draft_rejected',
    'safety_block',
    'style_profile_updated',
    'privacy_export',
    'data_deletion'
  ]),
  decision: z.enum(['allowed', 'blocked', 'manual_review_forced', 'completed']),
  contactId: z.string().optional(),
  reasonCode: z.string(),
  metadata: z.record(z.any()).optional()
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

// ==========================================
// 9. WhatsApp Integration & Automation Contracts
// ==========================================
export const WhatsAppProviderTypeSchema = z.enum([
  'official_cloud_api',
  'android_companion_listener',
  'clipboard_share_manual',
  'linked_devices_qr_personal'
]);
export type WhatsAppProviderType = z.infer<typeof WhatsAppProviderTypeSchema>;

export const WhatsAppConnectionStatusSchema = z.enum([
  'not_configured',
  'blocked_awaiting_meta_credentials',
  'ready_for_onboarding',
  'connected_active',
  'disconnected',
  'unavailable_unsupported',
  'error'
]);
export type WhatsAppConnectionStatus = z.infer<typeof WhatsAppConnectionStatusSchema>;

export const AutomationSettingsSchema = z.object({
  maniGlobalEnabled: z.boolean().default(false),
  autoSendEnabled: z.boolean().default(false), // STRICT DEFAULT FALSE
  activeProvider: WhatsAppProviderTypeSchema.default('clipboard_share_manual'),
  replyDelaySeconds: z.number().min(0).max(300).default(5),
  quietHoursEnabled: z.boolean().default(true),
  emergencyStop: z.boolean().default(false),
  lastWebhookTimestamp: z.string().datetime().optional(),
  lastEventReceived: z.string().optional(),
  lastSuccessfulSend: z.string().optional(),
  lastDeliveryFailure: z.string().optional(),
  updatedAt: z.string().datetime().optional()
});
export type AutomationSettings = z.infer<typeof AutomationSettingsSchema>;

export const WhatsAppCapabilityReportSchema = z.object({
  accountType: z.literal('normal_personal_whatsapp'),
  canAutoReplyWithDashboardClosed: z.boolean(),
  supportedProviders: z.array(z.object({
    provider: WhatsAppProviderTypeSchema,
    displayName: z.string(),
    description: z.string(),
    status: WhatsAppConnectionStatusSchema,
    worksWhenDashboardClosed: z.boolean(),
    requiresDedicatedNumber: z.boolean(),
    riskAssessment: z.string()
  }))
});
export type WhatsAppCapabilityReport = z.infer<typeof WhatsAppCapabilityReportSchema>;

// ==========================================
// 10. WhatsApp QR Session Contracts
// ==========================================
export const WhatsAppSessionStateSchema = z.enum([
  'not_configured',
  'connecting',
  'qr_ready',
  'connected',
  'expired',
  'disconnected',
  'error'
]);
export type WhatsAppSessionState = z.infer<typeof WhatsAppSessionStateSchema>;

export const WhatsAppQRInstructions = [
  'Open WhatsApp on your phone',
  'Tap Menu (Android ⋮) or Settings (iOS ⚙)',
  'Select "Linked Devices"',
  'Tap "Link a Device"',
  'Point your camera at this QR code to scan'
] as const;

export const WhatsAppConnectionSessionSchema = z.object({
  sessionId: z.string(),
  userId: z.string(),
  status: WhatsAppSessionStateSchema,
  qrPayload: z.string().optional(),
  expiresAt: z.string().optional(),
  connectedPhone: z.string().optional(),
  connectedAt: z.string().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  instructions: z.array(z.string()).default([...WhatsAppQRInstructions]),
  updatedAt: z.string()
});
export type WhatsAppConnectionSession = z.infer<typeof WhatsAppConnectionSessionSchema>;

export const WhatsAppConnectResponseSchema = z.object({
  sessionId: z.string().optional(),
  status: WhatsAppSessionStateSchema,
  qrPayload: z.string().optional(),
  expiresAt: z.string().optional(),
  connectedPhone: z.string().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  instructions: z.array(z.string()).optional()
});
export type WhatsAppConnectResponse = z.infer<typeof WhatsAppConnectResponseSchema>;

