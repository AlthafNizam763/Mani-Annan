class AuditLog {
  final String id;
  final String timestamp;
  final String eventType;
  final String decision;
  final String? contactId;
  final String reasonCode;
  final Map<String, dynamic>? metadata;

  const AuditLog({
    required this.id,
    required this.timestamp,
    required this.eventType,
    required this.decision,
    this.contactId,
    required this.reasonCode,
    this.metadata,
  });

  factory AuditLog.fromJson(Map<String, dynamic> json) {
    return AuditLog(
      id: json['id'] as String? ?? '',
      timestamp: json['timestamp'] as String? ?? '',
      eventType: json['eventType'] as String? ?? 'unknown',
      decision: json['decision'] as String? ?? 'completed',
      contactId: json['contactId'] as String?,
      reasonCode: json['reasonCode'] as String? ?? 'OK',
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }
}
