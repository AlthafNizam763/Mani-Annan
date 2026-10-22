class SafetyCheckResult {
  final bool isSafe;
  final bool requiresManualReview;
  final List<String> riskFlags;
  final String reason;

  const SafetyCheckResult({
    required this.isSafe,
    required this.requiresManualReview,
    this.riskFlags = const [],
    required this.reason,
  });

  factory SafetyCheckResult.fromJson(Map<String, dynamic> json) {
    return SafetyCheckResult(
      isSafe: json['isSafe'] as bool? ?? false,
      requiresManualReview: json['requiresManualReview'] as bool? ?? true,
      riskFlags: (json['riskFlags'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      reason: json['reason'] as String? ?? 'Deterministic safety evaluation complete',
    );
  }

  Map<String, dynamic> toJson() => {
    'isSafe': isSafe,
    'requiresManualReview': requiresManualReview,
    'riskFlags': riskFlags,
    'reason': reason,
  };
}

class ReplyDraft {
  final String id;
  final String contactId;
  final String contactName;
  final String relationship;
  final String incomingMessage;
  final String generatedReply;
  final String? editedReply;
  final SafetyCheckResult safetyCheck;
  final String reviewStatus; // pending, approved, rejected, edited, copied, shared
  final String providerUsed;
  final bool? isRealAI;
  final String? createdAt;
  final String? reviewedAt;

  const ReplyDraft({
    required this.id,
    required this.contactId,
    required this.contactName,
    required this.relationship,
    required this.incomingMessage,
    required this.generatedReply,
    this.editedReply,
    required this.safetyCheck,
    this.reviewStatus = 'pending',
    this.providerUsed = 'gemini',
    this.isRealAI,
    this.createdAt,
    this.reviewedAt,
  });

  factory ReplyDraft.fromJson(Map<String, dynamic> json) {
    return ReplyDraft(
      id: json['id'] as String? ?? '',
      contactId: json['contactId'] as String? ?? '',
      contactName: json['contactName'] as String? ?? 'Contact',
      relationship: json['relationship'] as String? ?? 'friend',
      incomingMessage: json['incomingMessage'] as String? ?? '',
      generatedReply: json['generatedReply'] as String? ?? '',
      editedReply: json['editedReply'] as String?,
      safetyCheck: json['safetyCheck'] is Map<String, dynamic>
          ? SafetyCheckResult.fromJson(json['safetyCheck'] as Map<String, dynamic>)
          : const SafetyCheckResult(
              isSafe: true,
              requiresManualReview: true,
              reason: 'Passed deterministic safety checks.',
            ),
      reviewStatus: json['reviewStatus'] as String? ?? 'pending',
      providerUsed: json['providerUsed'] as String? ?? 'gemini',
      isRealAI: json['isRealAI'] as bool?,
      createdAt: json['createdAt'] as String?,
      reviewedAt: json['reviewedAt'] as String?,
    );
  }

  ReplyDraft copyWith({
    String? editedReply,
    String? reviewStatus,
    String? reviewedAt,
  }) {
    return ReplyDraft(
      id: id,
      contactId: contactId,
      contactName: contactName,
      relationship: relationship,
      incomingMessage: incomingMessage,
      generatedReply: generatedReply,
      editedReply: editedReply ?? this.editedReply,
      safetyCheck: safetyCheck,
      reviewStatus: reviewStatus ?? this.reviewStatus,
      providerUsed: providerUsed,
      isRealAI: isRealAI,
      createdAt: createdAt,
      reviewedAt: reviewedAt ?? this.reviewedAt,
    );
  }

  String get activeReplyText =>
      (editedReply != null && editedReply!.isNotEmpty)
          ? editedReply!
          : generatedReply;
}
