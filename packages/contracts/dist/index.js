"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsAppConnectResponseSchema = exports.WhatsAppConnectionSessionSchema = exports.WhatsAppQRInstructions = exports.WhatsAppSessionStateSchema = exports.WhatsAppCapabilityReportSchema = exports.AutomationSettingsSchema = exports.WhatsAppConnectionStatusSchema = exports.WhatsAppProviderTypeSchema = exports.AuditEventSchema = exports.DraftFeedbackRequestSchema = exports.UpdateDraftReviewRequestSchema = exports.ReplyDraftSchema = exports.GenerateReplyRequestSchema = exports.SafetyCheckResultSchema = exports.SafetyRiskFlagSchema = exports.ImportChatResultSchema = exports.ImportChatRequestSchema = exports.UpdateContactRequestSchema = exports.CreateContactRequestSchema = exports.ContactSchema = exports.QuietHoursSchema = exports.UserProfileSchema = exports.StyleProfileSchema = exports.EmojiHabitsSchema = exports.PunctuationHabitsSchema = exports.MessageCategorySchema = exports.DraftReviewStatusSchema = exports.PreferredToneSchema = exports.RelationshipCategorySchema = void 0;
const zod_1 = require("zod");
// ==========================================
// 1. Enums & Literal Sets
// ==========================================
exports.RelationshipCategorySchema = zod_1.z.enum([
    'romantic_partner',
    'boss_or_manager',
    'friend',
    'family_member',
    'custom'
]);
exports.PreferredToneSchema = zod_1.z.enum([
    'casual',
    'professional',
    'warm_and_affectionate',
    'respectful',
    'humorous_playful',
    'neutral_direct'
]);
exports.DraftReviewStatusSchema = zod_1.z.enum([
    'pending',
    'approved',
    'rejected',
    'edited',
    'copied',
    'shared'
]);
exports.MessageCategorySchema = zod_1.z.enum([
    'general_chat',
    'scheduling_plans',
    'work_tasks',
    'sensitive_personal',
    'financial_transfer',
    'urgent_emergency'
]);
// ==========================================
// 2. Personal Writing Style Schema
// ==========================================
exports.PunctuationHabitsSchema = zod_1.z.object({
    multipleExclamations: zod_1.z.boolean().default(false),
    usesEllipsis: zod_1.z.boolean().default(true),
    omitsEndingPeriod: zod_1.z.boolean().default(true),
    questionMarksOnlyWhenNeeded: zod_1.z.boolean().default(true)
});
exports.EmojiHabitsSchema = zod_1.z.object({
    frequentEmojis: zod_1.z.array(zod_1.z.string()).default([]),
    emojiFrequency: zod_1.z.enum(['none', 'minimal', 'moderate', 'heavy']).default('moderate')
});
exports.StyleProfileSchema = zod_1.z.object({
    version: zod_1.z.number().default(1),
    primaryLanguages: zod_1.z.array(zod_1.z.string()).default(['en']),
    usesManglish: zod_1.z.boolean().default(true),
    commonSlang: zod_1.z.array(zod_1.z.string()).default(['lah', 'bro', 'dey', 'machan', 'ok ok']),
    avgSentenceLength: zod_1.z.enum(['short', 'medium', 'verbose']).default('short'),
    punctuationHabits: exports.PunctuationHabitsSchema.default({}),
    emojiHabits: exports.EmojiHabitsSchema.default({}),
    greetingStyle: zod_1.z.string().default('informal'),
    closingStyle: zod_1.z.string().default('casual'),
    customInstructions: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().datetime().optional()
});
// ==========================================
// 3. User & Settings Schema
// ==========================================
exports.UserProfileSchema = zod_1.z.object({
    uid: zod_1.z.string(),
    email: zod_1.z.string().email(),
    displayName: zod_1.z.string().optional(),
    createdAt: zod_1.z.string().datetime(),
    styleProfile: exports.StyleProfileSchema.optional()
});
// ==========================================
// 4. Contact Schema
// ==========================================
exports.QuietHoursSchema = zod_1.z.object({
    enabled: zod_1.z.boolean().default(false),
    start: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('22:00'),
    end: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).default('08:00'),
    timezone: zod_1.z.string().default('UTC')
});
exports.ContactSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1, 'Contact name is required'),
    phoneNumber: zod_1.z.string().optional(),
    relationship: exports.RelationshipCategorySchema.default('friend'),
    preferredTone: exports.PreferredToneSchema.default('casual'),
    customRelationshipNotes: zod_1.z.string().optional(),
    allowedCategories: zod_1.z.array(exports.MessageCategorySchema).default(['general_chat', 'scheduling_plans']),
    autoSendEnabled: zod_1.z.boolean().default(false), // STRICT DEFAULT FALSE
    quietHours: exports.QuietHoursSchema.default({}),
    sensitiveTopicsRequireReview: zod_1.z.boolean().default(true),
    isPaused: zod_1.z.boolean().default(false),
    createdAt: zod_1.z.string().datetime(),
    updatedAt: zod_1.z.string().datetime()
});
exports.CreateContactRequestSchema = exports.ContactSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true
});
exports.UpdateContactRequestSchema = exports.CreateContactRequestSchema.partial();
// ==========================================
// 5. Authorized Chat Import Schema
// ==========================================
exports.ImportChatRequestSchema = zod_1.z.object({
    rawText: zod_1.z.string().min(10, 'Chat export must contain valid text entries'),
    ownerIdentifier: zod_1.z.string().min(1, 'Owner name or sender identifier is required'),
    contactName: zod_1.z.string().optional(),
    consentConfirmed: zod_1.z.literal(true, {
        errorMap: () => ({ message: 'Explicit user authorization and consent is mandatory to process chat history' })
    })
});
exports.ImportChatResultSchema = zod_1.z.object({
    importId: zod_1.z.string(),
    status: zod_1.z.enum(['completed', 'failed', 'processing']),
    extractedOwnerMessagesCount: zod_1.z.number(),
    extractedContactMessagesCount: zod_1.z.number(),
    styleProfileUpdated: zod_1.z.boolean(),
    detectedSlang: zod_1.z.array(zod_1.z.string()),
    summary: zod_1.z.string()
});
// ==========================================
// 6. Reply Generation & Deterministic Safety
// ==========================================
exports.SafetyRiskFlagSchema = zod_1.z.enum([
    'financial_commitment',
    'credential_pii_detected',
    'urgent_emotional_distress',
    'legal_medical_advice',
    'unknown_fact_hallucination_risk',
    'unauthorized_auto_send',
    'quiet_hours_active',
    'contact_paused'
]);
exports.SafetyCheckResultSchema = zod_1.z.object({
    isSafe: zod_1.z.boolean(),
    requiresManualReview: zod_1.z.boolean(),
    riskFlags: zod_1.z.array(exports.SafetyRiskFlagSchema),
    reason: zod_1.z.string()
});
exports.GenerateReplyRequestSchema = zod_1.z.object({
    contactId: zod_1.z.string().min(1, 'Contact ID is required'),
    incomingMessage: zod_1.z.string().min(1, 'Incoming message cannot be empty'),
    optionalContext: zod_1.z.string().optional()
});
exports.ReplyDraftSchema = zod_1.z.object({
    id: zod_1.z.string(),
    contactId: zod_1.z.string(),
    contactName: zod_1.z.string(),
    relationship: exports.RelationshipCategorySchema,
    incomingMessage: zod_1.z.string(),
    generatedReply: zod_1.z.string(),
    editedReply: zod_1.z.string().optional(),
    safetyCheck: exports.SafetyCheckResultSchema,
    reviewStatus: exports.DraftReviewStatusSchema.default('pending'),
    providerUsed: zod_1.z.string().default('gemini'),
    createdAt: zod_1.z.string().datetime(),
    reviewedAt: zod_1.z.string().datetime().optional()
});
exports.UpdateDraftReviewRequestSchema = zod_1.z.object({
    reviewStatus: exports.DraftReviewStatusSchema,
    editedReply: zod_1.z.string().optional()
});
// ==========================================
// 7. Feedback & Continuous Learning Schema
// ==========================================
exports.DraftFeedbackRequestSchema = zod_1.z.object({
    draftId: zod_1.z.string(),
    rating: zod_1.z.enum(['helpful', 'needs_improvement', 'inaccurate_tone']),
    ownerCorrection: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional()
});
// ==========================================
// 8. Audit Event Schema
// ==========================================
exports.AuditEventSchema = zod_1.z.object({
    id: zod_1.z.string(),
    timestamp: zod_1.z.string().datetime(),
    eventType: zod_1.z.enum([
        'import_chat',
        'generate_reply',
        'draft_approved',
        'draft_rejected',
        'safety_block',
        'style_profile_updated',
        'privacy_export',
        'data_deletion'
    ]),
    decision: zod_1.z.enum(['allowed', 'blocked', 'manual_review_forced', 'completed']),
    contactId: zod_1.z.string().optional(),
    reasonCode: zod_1.z.string(),
    metadata: zod_1.z.record(zod_1.z.any()).optional()
});
// ==========================================
// 9. WhatsApp Integration & Automation Contracts
// ==========================================
exports.WhatsAppProviderTypeSchema = zod_1.z.enum([
    'official_cloud_api',
    'android_companion_listener',
    'clipboard_share_manual',
    'linked_devices_qr_personal'
]);
exports.WhatsAppConnectionStatusSchema = zod_1.z.enum([
    'not_configured',
    'blocked_awaiting_meta_credentials',
    'ready_for_onboarding',
    'connected_active',
    'disconnected',
    'unavailable_unsupported',
    'error'
]);
exports.AutomationSettingsSchema = zod_1.z.object({
    maniGlobalEnabled: zod_1.z.boolean().default(false),
    autoSendEnabled: zod_1.z.boolean().default(false), // STRICT DEFAULT FALSE
    activeProvider: exports.WhatsAppProviderTypeSchema.default('clipboard_share_manual'),
    replyDelaySeconds: zod_1.z.number().min(0).max(300).default(5),
    quietHoursEnabled: zod_1.z.boolean().default(true),
    emergencyStop: zod_1.z.boolean().default(false),
    lastWebhookTimestamp: zod_1.z.string().datetime().optional(),
    lastEventReceived: zod_1.z.string().optional(),
    lastSuccessfulSend: zod_1.z.string().optional(),
    lastDeliveryFailure: zod_1.z.string().optional(),
    updatedAt: zod_1.z.string().datetime().optional()
});
exports.WhatsAppCapabilityReportSchema = zod_1.z.object({
    accountType: zod_1.z.literal('normal_personal_whatsapp'),
    canAutoReplyWithDashboardClosed: zod_1.z.boolean(),
    supportedProviders: zod_1.z.array(zod_1.z.object({
        provider: exports.WhatsAppProviderTypeSchema,
        displayName: zod_1.z.string(),
        description: zod_1.z.string(),
        status: exports.WhatsAppConnectionStatusSchema,
        worksWhenDashboardClosed: zod_1.z.boolean(),
        requiresDedicatedNumber: zod_1.z.boolean(),
        riskAssessment: zod_1.z.string()
    }))
});
// ==========================================
// 10. WhatsApp QR Session Contracts
// ==========================================
exports.WhatsAppSessionStateSchema = zod_1.z.enum([
    'not_configured',
    'connecting',
    'qr_ready',
    'connected',
    'expired',
    'disconnected',
    'error'
]);
exports.WhatsAppQRInstructions = [
    'Open WhatsApp on your phone',
    'Tap Menu (Android ⋮) or Settings (iOS ⚙)',
    'Select "Linked Devices"',
    'Tap "Link a Device"',
    'Point your camera at this QR code to scan'
];
exports.WhatsAppConnectionSessionSchema = zod_1.z.object({
    sessionId: zod_1.z.string(),
    userId: zod_1.z.string(),
    status: exports.WhatsAppSessionStateSchema,
    qrPayload: zod_1.z.string().optional(),
    expiresAt: zod_1.z.string().optional(),
    connectedPhone: zod_1.z.string().optional(),
    connectedAt: zod_1.z.string().optional(),
    error: zod_1.z.string().optional(),
    message: zod_1.z.string().optional(),
    instructions: zod_1.z.array(zod_1.z.string()).default([...exports.WhatsAppQRInstructions]),
    updatedAt: zod_1.z.string()
});
exports.WhatsAppConnectResponseSchema = zod_1.z.object({
    sessionId: zod_1.z.string().optional(),
    status: exports.WhatsAppSessionStateSchema,
    qrPayload: zod_1.z.string().optional(),
    expiresAt: zod_1.z.string().optional(),
    connectedPhone: zod_1.z.string().optional(),
    error: zod_1.z.string().optional(),
    message: zod_1.z.string().optional(),
    instructions: zod_1.z.array(zod_1.z.string()).optional()
});
//# sourceMappingURL=index.js.map