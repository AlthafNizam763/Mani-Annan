import { z } from 'zod';
export declare const RelationshipCategorySchema: z.ZodEnum<["romantic_partner", "boss_or_manager", "friend", "family_member", "custom"]>;
export type RelationshipCategory = z.infer<typeof RelationshipCategorySchema>;
export declare const PreferredToneSchema: z.ZodEnum<["casual", "professional", "warm_and_affectionate", "respectful", "humorous_playful", "neutral_direct"]>;
export type PreferredTone = z.infer<typeof PreferredToneSchema>;
export declare const DraftReviewStatusSchema: z.ZodEnum<["pending", "approved", "rejected", "edited", "copied", "shared"]>;
export type DraftReviewStatus = z.infer<typeof DraftReviewStatusSchema>;
export declare const MessageCategorySchema: z.ZodEnum<["general_chat", "scheduling_plans", "work_tasks", "sensitive_personal", "financial_transfer", "urgent_emergency"]>;
export type MessageCategory = z.infer<typeof MessageCategorySchema>;
export declare const PunctuationHabitsSchema: z.ZodObject<{
    multipleExclamations: z.ZodDefault<z.ZodBoolean>;
    usesEllipsis: z.ZodDefault<z.ZodBoolean>;
    omitsEndingPeriod: z.ZodDefault<z.ZodBoolean>;
    questionMarksOnlyWhenNeeded: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    multipleExclamations: boolean;
    usesEllipsis: boolean;
    omitsEndingPeriod: boolean;
    questionMarksOnlyWhenNeeded: boolean;
}, {
    multipleExclamations?: boolean | undefined;
    usesEllipsis?: boolean | undefined;
    omitsEndingPeriod?: boolean | undefined;
    questionMarksOnlyWhenNeeded?: boolean | undefined;
}>;
export declare const EmojiHabitsSchema: z.ZodObject<{
    frequentEmojis: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    emojiFrequency: z.ZodDefault<z.ZodEnum<["none", "minimal", "moderate", "heavy"]>>;
}, "strip", z.ZodTypeAny, {
    frequentEmojis: string[];
    emojiFrequency: "none" | "minimal" | "moderate" | "heavy";
}, {
    frequentEmojis?: string[] | undefined;
    emojiFrequency?: "none" | "minimal" | "moderate" | "heavy" | undefined;
}>;
export declare const StyleProfileSchema: z.ZodObject<{
    version: z.ZodDefault<z.ZodNumber>;
    primaryLanguages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    usesManglish: z.ZodDefault<z.ZodBoolean>;
    commonSlang: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    avgSentenceLength: z.ZodDefault<z.ZodEnum<["short", "medium", "verbose"]>>;
    punctuationHabits: z.ZodDefault<z.ZodObject<{
        multipleExclamations: z.ZodDefault<z.ZodBoolean>;
        usesEllipsis: z.ZodDefault<z.ZodBoolean>;
        omitsEndingPeriod: z.ZodDefault<z.ZodBoolean>;
        questionMarksOnlyWhenNeeded: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        multipleExclamations: boolean;
        usesEllipsis: boolean;
        omitsEndingPeriod: boolean;
        questionMarksOnlyWhenNeeded: boolean;
    }, {
        multipleExclamations?: boolean | undefined;
        usesEllipsis?: boolean | undefined;
        omitsEndingPeriod?: boolean | undefined;
        questionMarksOnlyWhenNeeded?: boolean | undefined;
    }>>;
    emojiHabits: z.ZodDefault<z.ZodObject<{
        frequentEmojis: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        emojiFrequency: z.ZodDefault<z.ZodEnum<["none", "minimal", "moderate", "heavy"]>>;
    }, "strip", z.ZodTypeAny, {
        frequentEmojis: string[];
        emojiFrequency: "none" | "minimal" | "moderate" | "heavy";
    }, {
        frequentEmojis?: string[] | undefined;
        emojiFrequency?: "none" | "minimal" | "moderate" | "heavy" | undefined;
    }>>;
    greetingStyle: z.ZodDefault<z.ZodString>;
    closingStyle: z.ZodDefault<z.ZodString>;
    customInstructions: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    version: number;
    primaryLanguages: string[];
    usesManglish: boolean;
    commonSlang: string[];
    avgSentenceLength: "short" | "medium" | "verbose";
    punctuationHabits: {
        multipleExclamations: boolean;
        usesEllipsis: boolean;
        omitsEndingPeriod: boolean;
        questionMarksOnlyWhenNeeded: boolean;
    };
    emojiHabits: {
        frequentEmojis: string[];
        emojiFrequency: "none" | "minimal" | "moderate" | "heavy";
    };
    greetingStyle: string;
    closingStyle: string;
    customInstructions?: string | undefined;
    updatedAt?: string | undefined;
}, {
    version?: number | undefined;
    primaryLanguages?: string[] | undefined;
    usesManglish?: boolean | undefined;
    commonSlang?: string[] | undefined;
    avgSentenceLength?: "short" | "medium" | "verbose" | undefined;
    punctuationHabits?: {
        multipleExclamations?: boolean | undefined;
        usesEllipsis?: boolean | undefined;
        omitsEndingPeriod?: boolean | undefined;
        questionMarksOnlyWhenNeeded?: boolean | undefined;
    } | undefined;
    emojiHabits?: {
        frequentEmojis?: string[] | undefined;
        emojiFrequency?: "none" | "minimal" | "moderate" | "heavy" | undefined;
    } | undefined;
    greetingStyle?: string | undefined;
    closingStyle?: string | undefined;
    customInstructions?: string | undefined;
    updatedAt?: string | undefined;
}>;
export type StyleProfile = z.infer<typeof StyleProfileSchema>;
export declare const UserProfileSchema: z.ZodObject<{
    uid: z.ZodString;
    email: z.ZodString;
    displayName: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    styleProfile: z.ZodOptional<z.ZodObject<{
        version: z.ZodDefault<z.ZodNumber>;
        primaryLanguages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        usesManglish: z.ZodDefault<z.ZodBoolean>;
        commonSlang: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        avgSentenceLength: z.ZodDefault<z.ZodEnum<["short", "medium", "verbose"]>>;
        punctuationHabits: z.ZodDefault<z.ZodObject<{
            multipleExclamations: z.ZodDefault<z.ZodBoolean>;
            usesEllipsis: z.ZodDefault<z.ZodBoolean>;
            omitsEndingPeriod: z.ZodDefault<z.ZodBoolean>;
            questionMarksOnlyWhenNeeded: z.ZodDefault<z.ZodBoolean>;
        }, "strip", z.ZodTypeAny, {
            multipleExclamations: boolean;
            usesEllipsis: boolean;
            omitsEndingPeriod: boolean;
            questionMarksOnlyWhenNeeded: boolean;
        }, {
            multipleExclamations?: boolean | undefined;
            usesEllipsis?: boolean | undefined;
            omitsEndingPeriod?: boolean | undefined;
            questionMarksOnlyWhenNeeded?: boolean | undefined;
        }>>;
        emojiHabits: z.ZodDefault<z.ZodObject<{
            frequentEmojis: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            emojiFrequency: z.ZodDefault<z.ZodEnum<["none", "minimal", "moderate", "heavy"]>>;
        }, "strip", z.ZodTypeAny, {
            frequentEmojis: string[];
            emojiFrequency: "none" | "minimal" | "moderate" | "heavy";
        }, {
            frequentEmojis?: string[] | undefined;
            emojiFrequency?: "none" | "minimal" | "moderate" | "heavy" | undefined;
        }>>;
        greetingStyle: z.ZodDefault<z.ZodString>;
        closingStyle: z.ZodDefault<z.ZodString>;
        customInstructions: z.ZodOptional<z.ZodString>;
        updatedAt: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        version: number;
        primaryLanguages: string[];
        usesManglish: boolean;
        commonSlang: string[];
        avgSentenceLength: "short" | "medium" | "verbose";
        punctuationHabits: {
            multipleExclamations: boolean;
            usesEllipsis: boolean;
            omitsEndingPeriod: boolean;
            questionMarksOnlyWhenNeeded: boolean;
        };
        emojiHabits: {
            frequentEmojis: string[];
            emojiFrequency: "none" | "minimal" | "moderate" | "heavy";
        };
        greetingStyle: string;
        closingStyle: string;
        customInstructions?: string | undefined;
        updatedAt?: string | undefined;
    }, {
        version?: number | undefined;
        primaryLanguages?: string[] | undefined;
        usesManglish?: boolean | undefined;
        commonSlang?: string[] | undefined;
        avgSentenceLength?: "short" | "medium" | "verbose" | undefined;
        punctuationHabits?: {
            multipleExclamations?: boolean | undefined;
            usesEllipsis?: boolean | undefined;
            omitsEndingPeriod?: boolean | undefined;
            questionMarksOnlyWhenNeeded?: boolean | undefined;
        } | undefined;
        emojiHabits?: {
            frequentEmojis?: string[] | undefined;
            emojiFrequency?: "none" | "minimal" | "moderate" | "heavy" | undefined;
        } | undefined;
        greetingStyle?: string | undefined;
        closingStyle?: string | undefined;
        customInstructions?: string | undefined;
        updatedAt?: string | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    uid: string;
    email: string;
    createdAt: string;
    displayName?: string | undefined;
    styleProfile?: {
        version: number;
        primaryLanguages: string[];
        usesManglish: boolean;
        commonSlang: string[];
        avgSentenceLength: "short" | "medium" | "verbose";
        punctuationHabits: {
            multipleExclamations: boolean;
            usesEllipsis: boolean;
            omitsEndingPeriod: boolean;
            questionMarksOnlyWhenNeeded: boolean;
        };
        emojiHabits: {
            frequentEmojis: string[];
            emojiFrequency: "none" | "minimal" | "moderate" | "heavy";
        };
        greetingStyle: string;
        closingStyle: string;
        customInstructions?: string | undefined;
        updatedAt?: string | undefined;
    } | undefined;
}, {
    uid: string;
    email: string;
    createdAt: string;
    displayName?: string | undefined;
    styleProfile?: {
        version?: number | undefined;
        primaryLanguages?: string[] | undefined;
        usesManglish?: boolean | undefined;
        commonSlang?: string[] | undefined;
        avgSentenceLength?: "short" | "medium" | "verbose" | undefined;
        punctuationHabits?: {
            multipleExclamations?: boolean | undefined;
            usesEllipsis?: boolean | undefined;
            omitsEndingPeriod?: boolean | undefined;
            questionMarksOnlyWhenNeeded?: boolean | undefined;
        } | undefined;
        emojiHabits?: {
            frequentEmojis?: string[] | undefined;
            emojiFrequency?: "none" | "minimal" | "moderate" | "heavy" | undefined;
        } | undefined;
        greetingStyle?: string | undefined;
        closingStyle?: string | undefined;
        customInstructions?: string | undefined;
        updatedAt?: string | undefined;
    } | undefined;
}>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export declare const QuietHoursSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    start: z.ZodDefault<z.ZodString>;
    end: z.ZodDefault<z.ZodString>;
    timezone: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
}, {
    enabled?: boolean | undefined;
    start?: string | undefined;
    end?: string | undefined;
    timezone?: string | undefined;
}>;
export declare const ContactSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    phoneNumber: z.ZodOptional<z.ZodString>;
    relationship: z.ZodDefault<z.ZodEnum<["romantic_partner", "boss_or_manager", "friend", "family_member", "custom"]>>;
    preferredTone: z.ZodDefault<z.ZodEnum<["casual", "professional", "warm_and_affectionate", "respectful", "humorous_playful", "neutral_direct"]>>;
    customRelationshipNotes: z.ZodOptional<z.ZodString>;
    allowedCategories: z.ZodDefault<z.ZodArray<z.ZodEnum<["general_chat", "scheduling_plans", "work_tasks", "sensitive_personal", "financial_transfer", "urgent_emergency"]>, "many">>;
    autoSendEnabled: z.ZodDefault<z.ZodBoolean>;
    quietHours: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        start: z.ZodDefault<z.ZodString>;
        end: z.ZodDefault<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        start: string;
        end: string;
        timezone: string;
    }, {
        enabled?: boolean | undefined;
        start?: string | undefined;
        end?: string | undefined;
        timezone?: string | undefined;
    }>>;
    sensitiveTopicsRequireReview: z.ZodDefault<z.ZodBoolean>;
    isPaused: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    updatedAt: string;
    createdAt: string;
    id: string;
    name: string;
    relationship: "romantic_partner" | "boss_or_manager" | "friend" | "family_member" | "custom";
    preferredTone: "casual" | "professional" | "warm_and_affectionate" | "respectful" | "humorous_playful" | "neutral_direct";
    allowedCategories: ("general_chat" | "scheduling_plans" | "work_tasks" | "sensitive_personal" | "financial_transfer" | "urgent_emergency")[];
    autoSendEnabled: boolean;
    quietHours: {
        enabled: boolean;
        start: string;
        end: string;
        timezone: string;
    };
    sensitiveTopicsRequireReview: boolean;
    isPaused: boolean;
    phoneNumber?: string | undefined;
    customRelationshipNotes?: string | undefined;
}, {
    updatedAt: string;
    createdAt: string;
    id: string;
    name: string;
    phoneNumber?: string | undefined;
    relationship?: "romantic_partner" | "boss_or_manager" | "friend" | "family_member" | "custom" | undefined;
    preferredTone?: "casual" | "professional" | "warm_and_affectionate" | "respectful" | "humorous_playful" | "neutral_direct" | undefined;
    customRelationshipNotes?: string | undefined;
    allowedCategories?: ("general_chat" | "scheduling_plans" | "work_tasks" | "sensitive_personal" | "financial_transfer" | "urgent_emergency")[] | undefined;
    autoSendEnabled?: boolean | undefined;
    quietHours?: {
        enabled?: boolean | undefined;
        start?: string | undefined;
        end?: string | undefined;
        timezone?: string | undefined;
    } | undefined;
    sensitiveTopicsRequireReview?: boolean | undefined;
    isPaused?: boolean | undefined;
}>;
export type Contact = z.infer<typeof ContactSchema>;
export declare const CreateContactRequestSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    name: z.ZodString;
    phoneNumber: z.ZodOptional<z.ZodString>;
    relationship: z.ZodDefault<z.ZodEnum<["romantic_partner", "boss_or_manager", "friend", "family_member", "custom"]>>;
    preferredTone: z.ZodDefault<z.ZodEnum<["casual", "professional", "warm_and_affectionate", "respectful", "humorous_playful", "neutral_direct"]>>;
    customRelationshipNotes: z.ZodOptional<z.ZodString>;
    allowedCategories: z.ZodDefault<z.ZodArray<z.ZodEnum<["general_chat", "scheduling_plans", "work_tasks", "sensitive_personal", "financial_transfer", "urgent_emergency"]>, "many">>;
    autoSendEnabled: z.ZodDefault<z.ZodBoolean>;
    quietHours: z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        start: z.ZodDefault<z.ZodString>;
        end: z.ZodDefault<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        start: string;
        end: string;
        timezone: string;
    }, {
        enabled?: boolean | undefined;
        start?: string | undefined;
        end?: string | undefined;
        timezone?: string | undefined;
    }>>;
    sensitiveTopicsRequireReview: z.ZodDefault<z.ZodBoolean>;
    isPaused: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
}, "updatedAt" | "createdAt" | "id">, "strip", z.ZodTypeAny, {
    name: string;
    relationship: "romantic_partner" | "boss_or_manager" | "friend" | "family_member" | "custom";
    preferredTone: "casual" | "professional" | "warm_and_affectionate" | "respectful" | "humorous_playful" | "neutral_direct";
    allowedCategories: ("general_chat" | "scheduling_plans" | "work_tasks" | "sensitive_personal" | "financial_transfer" | "urgent_emergency")[];
    autoSendEnabled: boolean;
    quietHours: {
        enabled: boolean;
        start: string;
        end: string;
        timezone: string;
    };
    sensitiveTopicsRequireReview: boolean;
    isPaused: boolean;
    phoneNumber?: string | undefined;
    customRelationshipNotes?: string | undefined;
}, {
    name: string;
    phoneNumber?: string | undefined;
    relationship?: "romantic_partner" | "boss_or_manager" | "friend" | "family_member" | "custom" | undefined;
    preferredTone?: "casual" | "professional" | "warm_and_affectionate" | "respectful" | "humorous_playful" | "neutral_direct" | undefined;
    customRelationshipNotes?: string | undefined;
    allowedCategories?: ("general_chat" | "scheduling_plans" | "work_tasks" | "sensitive_personal" | "financial_transfer" | "urgent_emergency")[] | undefined;
    autoSendEnabled?: boolean | undefined;
    quietHours?: {
        enabled?: boolean | undefined;
        start?: string | undefined;
        end?: string | undefined;
        timezone?: string | undefined;
    } | undefined;
    sensitiveTopicsRequireReview?: boolean | undefined;
    isPaused?: boolean | undefined;
}>;
export type CreateContactRequest = z.infer<typeof CreateContactRequestSchema>;
export declare const UpdateContactRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phoneNumber: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    relationship: z.ZodOptional<z.ZodDefault<z.ZodEnum<["romantic_partner", "boss_or_manager", "friend", "family_member", "custom"]>>>;
    preferredTone: z.ZodOptional<z.ZodDefault<z.ZodEnum<["casual", "professional", "warm_and_affectionate", "respectful", "humorous_playful", "neutral_direct"]>>>;
    customRelationshipNotes: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    allowedCategories: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodEnum<["general_chat", "scheduling_plans", "work_tasks", "sensitive_personal", "financial_transfer", "urgent_emergency"]>, "many">>>;
    autoSendEnabled: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    quietHours: z.ZodOptional<z.ZodDefault<z.ZodObject<{
        enabled: z.ZodDefault<z.ZodBoolean>;
        start: z.ZodDefault<z.ZodString>;
        end: z.ZodDefault<z.ZodString>;
        timezone: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        enabled: boolean;
        start: string;
        end: string;
        timezone: string;
    }, {
        enabled?: boolean | undefined;
        start?: string | undefined;
        end?: string | undefined;
        timezone?: string | undefined;
    }>>>;
    sensitiveTopicsRequireReview: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
    isPaused: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phoneNumber?: string | undefined;
    relationship?: "romantic_partner" | "boss_or_manager" | "friend" | "family_member" | "custom" | undefined;
    preferredTone?: "casual" | "professional" | "warm_and_affectionate" | "respectful" | "humorous_playful" | "neutral_direct" | undefined;
    customRelationshipNotes?: string | undefined;
    allowedCategories?: ("general_chat" | "scheduling_plans" | "work_tasks" | "sensitive_personal" | "financial_transfer" | "urgent_emergency")[] | undefined;
    autoSendEnabled?: boolean | undefined;
    quietHours?: {
        enabled: boolean;
        start: string;
        end: string;
        timezone: string;
    } | undefined;
    sensitiveTopicsRequireReview?: boolean | undefined;
    isPaused?: boolean | undefined;
}, {
    name?: string | undefined;
    phoneNumber?: string | undefined;
    relationship?: "romantic_partner" | "boss_or_manager" | "friend" | "family_member" | "custom" | undefined;
    preferredTone?: "casual" | "professional" | "warm_and_affectionate" | "respectful" | "humorous_playful" | "neutral_direct" | undefined;
    customRelationshipNotes?: string | undefined;
    allowedCategories?: ("general_chat" | "scheduling_plans" | "work_tasks" | "sensitive_personal" | "financial_transfer" | "urgent_emergency")[] | undefined;
    autoSendEnabled?: boolean | undefined;
    quietHours?: {
        enabled?: boolean | undefined;
        start?: string | undefined;
        end?: string | undefined;
        timezone?: string | undefined;
    } | undefined;
    sensitiveTopicsRequireReview?: boolean | undefined;
    isPaused?: boolean | undefined;
}>;
export type UpdateContactRequest = z.infer<typeof UpdateContactRequestSchema>;
export declare const ImportChatRequestSchema: z.ZodObject<{
    rawText: z.ZodString;
    ownerIdentifier: z.ZodString;
    contactName: z.ZodOptional<z.ZodString>;
    consentConfirmed: z.ZodLiteral<true>;
}, "strip", z.ZodTypeAny, {
    rawText: string;
    ownerIdentifier: string;
    consentConfirmed: true;
    contactName?: string | undefined;
}, {
    rawText: string;
    ownerIdentifier: string;
    consentConfirmed: true;
    contactName?: string | undefined;
}>;
export type ImportChatRequest = z.infer<typeof ImportChatRequestSchema>;
export declare const ImportChatResultSchema: z.ZodObject<{
    importId: z.ZodString;
    status: z.ZodEnum<["completed", "failed", "processing"]>;
    extractedOwnerMessagesCount: z.ZodNumber;
    extractedContactMessagesCount: z.ZodNumber;
    styleProfileUpdated: z.ZodBoolean;
    detectedSlang: z.ZodArray<z.ZodString, "many">;
    summary: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "failed" | "processing";
    importId: string;
    extractedOwnerMessagesCount: number;
    extractedContactMessagesCount: number;
    styleProfileUpdated: boolean;
    detectedSlang: string[];
    summary: string;
}, {
    status: "completed" | "failed" | "processing";
    importId: string;
    extractedOwnerMessagesCount: number;
    extractedContactMessagesCount: number;
    styleProfileUpdated: boolean;
    detectedSlang: string[];
    summary: string;
}>;
export type ImportChatResult = z.infer<typeof ImportChatResultSchema>;
export declare const SafetyRiskFlagSchema: z.ZodEnum<["financial_commitment", "credential_pii_detected", "urgent_emotional_distress", "legal_medical_advice", "unknown_fact_hallucination_risk", "unauthorized_auto_send", "quiet_hours_active", "contact_paused"]>;
export type SafetyRiskFlag = z.infer<typeof SafetyRiskFlagSchema>;
export declare const SafetyCheckResultSchema: z.ZodObject<{
    isSafe: z.ZodBoolean;
    requiresManualReview: z.ZodBoolean;
    riskFlags: z.ZodArray<z.ZodEnum<["financial_commitment", "credential_pii_detected", "urgent_emotional_distress", "legal_medical_advice", "unknown_fact_hallucination_risk", "unauthorized_auto_send", "quiet_hours_active", "contact_paused"]>, "many">;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    isSafe: boolean;
    requiresManualReview: boolean;
    riskFlags: ("financial_commitment" | "credential_pii_detected" | "urgent_emotional_distress" | "legal_medical_advice" | "unknown_fact_hallucination_risk" | "unauthorized_auto_send" | "quiet_hours_active" | "contact_paused")[];
    reason: string;
}, {
    isSafe: boolean;
    requiresManualReview: boolean;
    riskFlags: ("financial_commitment" | "credential_pii_detected" | "urgent_emotional_distress" | "legal_medical_advice" | "unknown_fact_hallucination_risk" | "unauthorized_auto_send" | "quiet_hours_active" | "contact_paused")[];
    reason: string;
}>;
export type SafetyCheckResult = z.infer<typeof SafetyCheckResultSchema>;
export declare const GenerateReplyRequestSchema: z.ZodObject<{
    contactId: z.ZodString;
    incomingMessage: z.ZodString;
    optionalContext: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    contactId: string;
    incomingMessage: string;
    optionalContext?: string | undefined;
}, {
    contactId: string;
    incomingMessage: string;
    optionalContext?: string | undefined;
}>;
export type GenerateReplyRequest = z.infer<typeof GenerateReplyRequestSchema>;
export declare const ReplyDraftSchema: z.ZodObject<{
    id: z.ZodString;
    contactId: z.ZodString;
    contactName: z.ZodString;
    relationship: z.ZodEnum<["romantic_partner", "boss_or_manager", "friend", "family_member", "custom"]>;
    incomingMessage: z.ZodString;
    generatedReply: z.ZodString;
    editedReply: z.ZodOptional<z.ZodString>;
    safetyCheck: z.ZodObject<{
        isSafe: z.ZodBoolean;
        requiresManualReview: z.ZodBoolean;
        riskFlags: z.ZodArray<z.ZodEnum<["financial_commitment", "credential_pii_detected", "urgent_emotional_distress", "legal_medical_advice", "unknown_fact_hallucination_risk", "unauthorized_auto_send", "quiet_hours_active", "contact_paused"]>, "many">;
        reason: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        isSafe: boolean;
        requiresManualReview: boolean;
        riskFlags: ("financial_commitment" | "credential_pii_detected" | "urgent_emotional_distress" | "legal_medical_advice" | "unknown_fact_hallucination_risk" | "unauthorized_auto_send" | "quiet_hours_active" | "contact_paused")[];
        reason: string;
    }, {
        isSafe: boolean;
        requiresManualReview: boolean;
        riskFlags: ("financial_commitment" | "credential_pii_detected" | "urgent_emotional_distress" | "legal_medical_advice" | "unknown_fact_hallucination_risk" | "unauthorized_auto_send" | "quiet_hours_active" | "contact_paused")[];
        reason: string;
    }>;
    reviewStatus: z.ZodDefault<z.ZodEnum<["pending", "approved", "rejected", "edited", "copied", "shared"]>>;
    providerUsed: z.ZodDefault<z.ZodString>;
    createdAt: z.ZodString;
    reviewedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    createdAt: string;
    id: string;
    relationship: "romantic_partner" | "boss_or_manager" | "friend" | "family_member" | "custom";
    contactName: string;
    contactId: string;
    incomingMessage: string;
    generatedReply: string;
    safetyCheck: {
        isSafe: boolean;
        requiresManualReview: boolean;
        riskFlags: ("financial_commitment" | "credential_pii_detected" | "urgent_emotional_distress" | "legal_medical_advice" | "unknown_fact_hallucination_risk" | "unauthorized_auto_send" | "quiet_hours_active" | "contact_paused")[];
        reason: string;
    };
    reviewStatus: "pending" | "approved" | "rejected" | "edited" | "copied" | "shared";
    providerUsed: string;
    editedReply?: string | undefined;
    reviewedAt?: string | undefined;
}, {
    createdAt: string;
    id: string;
    relationship: "romantic_partner" | "boss_or_manager" | "friend" | "family_member" | "custom";
    contactName: string;
    contactId: string;
    incomingMessage: string;
    generatedReply: string;
    safetyCheck: {
        isSafe: boolean;
        requiresManualReview: boolean;
        riskFlags: ("financial_commitment" | "credential_pii_detected" | "urgent_emotional_distress" | "legal_medical_advice" | "unknown_fact_hallucination_risk" | "unauthorized_auto_send" | "quiet_hours_active" | "contact_paused")[];
        reason: string;
    };
    editedReply?: string | undefined;
    reviewStatus?: "pending" | "approved" | "rejected" | "edited" | "copied" | "shared" | undefined;
    providerUsed?: string | undefined;
    reviewedAt?: string | undefined;
}>;
export type ReplyDraft = z.infer<typeof ReplyDraftSchema>;
export declare const UpdateDraftReviewRequestSchema: z.ZodObject<{
    reviewStatus: z.ZodEnum<["pending", "approved", "rejected", "edited", "copied", "shared"]>;
    editedReply: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    reviewStatus: "pending" | "approved" | "rejected" | "edited" | "copied" | "shared";
    editedReply?: string | undefined;
}, {
    reviewStatus: "pending" | "approved" | "rejected" | "edited" | "copied" | "shared";
    editedReply?: string | undefined;
}>;
export type UpdateDraftReviewRequest = z.infer<typeof UpdateDraftReviewRequestSchema>;
export declare const DraftFeedbackRequestSchema: z.ZodObject<{
    draftId: z.ZodString;
    rating: z.ZodEnum<["helpful", "needs_improvement", "inaccurate_tone"]>;
    ownerCorrection: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    draftId: string;
    rating: "helpful" | "needs_improvement" | "inaccurate_tone";
    ownerCorrection?: string | undefined;
    notes?: string | undefined;
}, {
    draftId: string;
    rating: "helpful" | "needs_improvement" | "inaccurate_tone";
    ownerCorrection?: string | undefined;
    notes?: string | undefined;
}>;
export type DraftFeedbackRequest = z.infer<typeof DraftFeedbackRequestSchema>;
export declare const AuditEventSchema: z.ZodObject<{
    id: z.ZodString;
    timestamp: z.ZodString;
    eventType: z.ZodEnum<["import_chat", "generate_reply", "draft_approved", "draft_rejected", "safety_block", "style_profile_updated", "privacy_export", "data_deletion"]>;
    decision: z.ZodEnum<["allowed", "blocked", "manual_review_forced", "completed"]>;
    contactId: z.ZodOptional<z.ZodString>;
    reasonCode: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    timestamp: string;
    eventType: "import_chat" | "generate_reply" | "draft_approved" | "draft_rejected" | "safety_block" | "style_profile_updated" | "privacy_export" | "data_deletion";
    decision: "completed" | "allowed" | "blocked" | "manual_review_forced";
    reasonCode: string;
    contactId?: string | undefined;
    metadata?: Record<string, any> | undefined;
}, {
    id: string;
    timestamp: string;
    eventType: "import_chat" | "generate_reply" | "draft_approved" | "draft_rejected" | "safety_block" | "style_profile_updated" | "privacy_export" | "data_deletion";
    decision: "completed" | "allowed" | "blocked" | "manual_review_forced";
    reasonCode: string;
    contactId?: string | undefined;
    metadata?: Record<string, any> | undefined;
}>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export declare const WhatsAppProviderTypeSchema: z.ZodEnum<["official_cloud_api", "android_companion_listener", "clipboard_share_manual", "linked_devices_qr_personal"]>;
export type WhatsAppProviderType = z.infer<typeof WhatsAppProviderTypeSchema>;
export declare const WhatsAppConnectionStatusSchema: z.ZodEnum<["not_configured", "blocked_awaiting_meta_credentials", "ready_for_onboarding", "connected_active", "disconnected", "unavailable_unsupported", "error"]>;
export type WhatsAppConnectionStatus = z.infer<typeof WhatsAppConnectionStatusSchema>;
export declare const AutomationSettingsSchema: z.ZodObject<{
    maniGlobalEnabled: z.ZodDefault<z.ZodBoolean>;
    autoSendEnabled: z.ZodDefault<z.ZodBoolean>;
    activeProvider: z.ZodDefault<z.ZodEnum<["official_cloud_api", "android_companion_listener", "clipboard_share_manual", "linked_devices_qr_personal"]>>;
    replyDelaySeconds: z.ZodDefault<z.ZodNumber>;
    quietHoursEnabled: z.ZodDefault<z.ZodBoolean>;
    emergencyStop: z.ZodDefault<z.ZodBoolean>;
    lastWebhookTimestamp: z.ZodOptional<z.ZodString>;
    lastEventReceived: z.ZodOptional<z.ZodString>;
    lastSuccessfulSend: z.ZodOptional<z.ZodString>;
    lastDeliveryFailure: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    autoSendEnabled: boolean;
    maniGlobalEnabled: boolean;
    activeProvider: "official_cloud_api" | "android_companion_listener" | "clipboard_share_manual" | "linked_devices_qr_personal";
    replyDelaySeconds: number;
    quietHoursEnabled: boolean;
    emergencyStop: boolean;
    updatedAt?: string | undefined;
    lastWebhookTimestamp?: string | undefined;
    lastEventReceived?: string | undefined;
    lastSuccessfulSend?: string | undefined;
    lastDeliveryFailure?: string | undefined;
}, {
    updatedAt?: string | undefined;
    autoSendEnabled?: boolean | undefined;
    maniGlobalEnabled?: boolean | undefined;
    activeProvider?: "official_cloud_api" | "android_companion_listener" | "clipboard_share_manual" | "linked_devices_qr_personal" | undefined;
    replyDelaySeconds?: number | undefined;
    quietHoursEnabled?: boolean | undefined;
    emergencyStop?: boolean | undefined;
    lastWebhookTimestamp?: string | undefined;
    lastEventReceived?: string | undefined;
    lastSuccessfulSend?: string | undefined;
    lastDeliveryFailure?: string | undefined;
}>;
export type AutomationSettings = z.infer<typeof AutomationSettingsSchema>;
export declare const WhatsAppCapabilityReportSchema: z.ZodObject<{
    accountType: z.ZodLiteral<"normal_personal_whatsapp">;
    canAutoReplyWithDashboardClosed: z.ZodBoolean;
    supportedProviders: z.ZodArray<z.ZodObject<{
        provider: z.ZodEnum<["official_cloud_api", "android_companion_listener", "clipboard_share_manual", "linked_devices_qr_personal"]>;
        displayName: z.ZodString;
        description: z.ZodString;
        status: z.ZodEnum<["not_configured", "blocked_awaiting_meta_credentials", "ready_for_onboarding", "connected_active", "disconnected", "unavailable_unsupported", "error"]>;
        worksWhenDashboardClosed: z.ZodBoolean;
        requiresDedicatedNumber: z.ZodBoolean;
        riskAssessment: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        status: "not_configured" | "blocked_awaiting_meta_credentials" | "ready_for_onboarding" | "connected_active" | "disconnected" | "unavailable_unsupported" | "error";
        displayName: string;
        provider: "official_cloud_api" | "android_companion_listener" | "clipboard_share_manual" | "linked_devices_qr_personal";
        description: string;
        worksWhenDashboardClosed: boolean;
        requiresDedicatedNumber: boolean;
        riskAssessment: string;
    }, {
        status: "not_configured" | "blocked_awaiting_meta_credentials" | "ready_for_onboarding" | "connected_active" | "disconnected" | "unavailable_unsupported" | "error";
        displayName: string;
        provider: "official_cloud_api" | "android_companion_listener" | "clipboard_share_manual" | "linked_devices_qr_personal";
        description: string;
        worksWhenDashboardClosed: boolean;
        requiresDedicatedNumber: boolean;
        riskAssessment: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    accountType: "normal_personal_whatsapp";
    canAutoReplyWithDashboardClosed: boolean;
    supportedProviders: {
        status: "not_configured" | "blocked_awaiting_meta_credentials" | "ready_for_onboarding" | "connected_active" | "disconnected" | "unavailable_unsupported" | "error";
        displayName: string;
        provider: "official_cloud_api" | "android_companion_listener" | "clipboard_share_manual" | "linked_devices_qr_personal";
        description: string;
        worksWhenDashboardClosed: boolean;
        requiresDedicatedNumber: boolean;
        riskAssessment: string;
    }[];
}, {
    accountType: "normal_personal_whatsapp";
    canAutoReplyWithDashboardClosed: boolean;
    supportedProviders: {
        status: "not_configured" | "blocked_awaiting_meta_credentials" | "ready_for_onboarding" | "connected_active" | "disconnected" | "unavailable_unsupported" | "error";
        displayName: string;
        provider: "official_cloud_api" | "android_companion_listener" | "clipboard_share_manual" | "linked_devices_qr_personal";
        description: string;
        worksWhenDashboardClosed: boolean;
        requiresDedicatedNumber: boolean;
        riskAssessment: string;
    }[];
}>;
export type WhatsAppCapabilityReport = z.infer<typeof WhatsAppCapabilityReportSchema>;
export declare const WhatsAppSessionStateSchema: z.ZodEnum<["not_configured", "connecting", "qr_ready", "connected", "expired", "disconnected", "error"]>;
export type WhatsAppSessionState = z.infer<typeof WhatsAppSessionStateSchema>;
export declare const WhatsAppQRInstructions: readonly ["Open WhatsApp on your phone", "Tap Menu (Android ⋮) or Settings (iOS ⚙)", "Select \"Linked Devices\"", "Tap \"Link a Device\"", "Point your camera at this QR code to scan"];
export declare const WhatsAppConnectionSessionSchema: z.ZodObject<{
    sessionId: z.ZodString;
    userId: z.ZodString;
    status: z.ZodEnum<["not_configured", "connecting", "qr_ready", "connected", "expired", "disconnected", "error"]>;
    qrPayload: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodString>;
    connectedPhone: z.ZodOptional<z.ZodString>;
    connectedAt: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    instructions: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    updatedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: "not_configured" | "disconnected" | "error" | "connecting" | "qr_ready" | "connected" | "expired";
    updatedAt: string;
    sessionId: string;
    userId: string;
    instructions: string[];
    message?: string | undefined;
    error?: string | undefined;
    qrPayload?: string | undefined;
    expiresAt?: string | undefined;
    connectedPhone?: string | undefined;
    connectedAt?: string | undefined;
}, {
    status: "not_configured" | "disconnected" | "error" | "connecting" | "qr_ready" | "connected" | "expired";
    updatedAt: string;
    sessionId: string;
    userId: string;
    message?: string | undefined;
    error?: string | undefined;
    qrPayload?: string | undefined;
    expiresAt?: string | undefined;
    connectedPhone?: string | undefined;
    connectedAt?: string | undefined;
    instructions?: string[] | undefined;
}>;
export type WhatsAppConnectionSession = z.infer<typeof WhatsAppConnectionSessionSchema>;
export declare const WhatsAppConnectResponseSchema: z.ZodObject<{
    sessionId: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["not_configured", "connecting", "qr_ready", "connected", "expired", "disconnected", "error"]>;
    qrPayload: z.ZodOptional<z.ZodString>;
    expiresAt: z.ZodOptional<z.ZodString>;
    connectedPhone: z.ZodOptional<z.ZodString>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    instructions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    status: "not_configured" | "disconnected" | "error" | "connecting" | "qr_ready" | "connected" | "expired";
    message?: string | undefined;
    error?: string | undefined;
    sessionId?: string | undefined;
    qrPayload?: string | undefined;
    expiresAt?: string | undefined;
    connectedPhone?: string | undefined;
    instructions?: string[] | undefined;
}, {
    status: "not_configured" | "disconnected" | "error" | "connecting" | "qr_ready" | "connected" | "expired";
    message?: string | undefined;
    error?: string | undefined;
    sessionId?: string | undefined;
    qrPayload?: string | undefined;
    expiresAt?: string | undefined;
    connectedPhone?: string | undefined;
    instructions?: string[] | undefined;
}>;
export type WhatsAppConnectResponse = z.infer<typeof WhatsAppConnectResponseSchema>;
//# sourceMappingURL=index.d.ts.map