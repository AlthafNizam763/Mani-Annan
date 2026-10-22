class SupportedProvider {
  final String provider;
  final String displayName;
  final String description;
  final String status; // not_configured, blocked_awaiting_meta_credentials, ready_for_onboarding, connected_active, disconnected, unavailable_unsupported, error
  final bool worksWhenDashboardClosed;
  final bool requiresDedicatedNumber;
  final String? riskAssessment;

  const SupportedProvider({
    required this.provider,
    required this.displayName,
    required this.description,
    required this.status,
    required this.worksWhenDashboardClosed,
    required this.requiresDedicatedNumber,
    this.riskAssessment,
  });

  factory SupportedProvider.fromJson(Map<String, dynamic> json) {
    return SupportedProvider(
      provider: json['provider'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
      description: json['description'] as String? ?? '',
      status: json['status'] as String? ?? 'not_configured',
      worksWhenDashboardClosed:
          json['worksWhenDashboardClosed'] as bool? ?? false,
      requiresDedicatedNumber:
          json['requiresDedicatedNumber'] as bool? ?? false,
      riskAssessment: json['riskAssessment'] as String?,
    );
  }
}

class WhatsAppCapabilityReport {
  final String accountType;
  final bool canAutoReplyWithDashboardClosed;
  final List<SupportedProvider> supportedProviders;

  const WhatsAppCapabilityReport({
    required this.accountType,
    required this.canAutoReplyWithDashboardClosed,
    required this.supportedProviders,
  });

  factory WhatsAppCapabilityReport.fromJson(Map<String, dynamic> json) {
    return WhatsAppCapabilityReport(
      accountType: json['accountType'] as String? ?? 'normal_personal_whatsapp',
      canAutoReplyWithDashboardClosed:
          json['canAutoReplyWithDashboardClosed'] as bool? ?? false,
      supportedProviders: (json['supportedProviders'] as List<dynamic>?)
              ?.map((e) => SupportedProvider.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
    );
  }
}

class AutomationSettings {
  final bool maniGlobalEnabled;
  final bool autoSendEnabled;
  final String activeProvider;
  final int replyDelaySeconds;
  final bool quietHoursEnabled;
  final bool emergencyStop;
  final String? lastWebhookTimestamp;
  final String? lastEventReceived;
  final String? lastSuccessfulSend;
  final String? lastDeliveryFailure;
  final String? updatedAt;

  const AutomationSettings({
    this.maniGlobalEnabled = false,
    this.autoSendEnabled = false,
    this.activeProvider = 'clipboard_share_manual',
    this.replyDelaySeconds = 5,
    this.quietHoursEnabled = true,
    this.emergencyStop = false,
    this.lastWebhookTimestamp,
    this.lastEventReceived,
    this.lastSuccessfulSend,
    this.lastDeliveryFailure,
    this.updatedAt,
  });

  factory AutomationSettings.fromJson(Map<String, dynamic> json) {
    return AutomationSettings(
      maniGlobalEnabled: json['maniGlobalEnabled'] as bool? ?? false,
      autoSendEnabled: json['autoSendEnabled'] as bool? ?? false,
      activeProvider: json['activeProvider'] as String? ?? 'clipboard_share_manual',
      replyDelaySeconds: json['replyDelaySeconds'] is int ? json['replyDelaySeconds'] : 5,
      quietHoursEnabled: json['quietHoursEnabled'] as bool? ?? true,
      emergencyStop: json['emergencyStop'] as bool? ?? false,
      lastWebhookTimestamp: json['lastWebhookTimestamp'] as String?,
      lastEventReceived: json['lastEventReceived'] as String?,
      lastSuccessfulSend: json['lastSuccessfulSend'] as String?,
      lastDeliveryFailure: json['lastDeliveryFailure'] as String?,
      updatedAt: json['updatedAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'maniGlobalEnabled': maniGlobalEnabled,
    'autoSendEnabled': autoSendEnabled,
    'activeProvider': activeProvider,
    'replyDelaySeconds': replyDelaySeconds,
    'quietHoursEnabled': quietHoursEnabled,
    'emergencyStop': emergencyStop,
    if (lastWebhookTimestamp != null)
      'lastWebhookTimestamp': lastWebhookTimestamp,
    if (lastEventReceived != null) 'lastEventReceived': lastEventReceived,
    if (lastSuccessfulSend != null) 'lastSuccessfulSend': lastSuccessfulSend,
    if (lastDeliveryFailure != null)
      'lastDeliveryFailure': lastDeliveryFailure,
    if (updatedAt != null) 'updatedAt': updatedAt,
  };

  AutomationSettings copyWith({
    bool? maniGlobalEnabled,
    bool? autoSendEnabled,
    String? activeProvider,
    int? replyDelaySeconds,
    bool? quietHoursEnabled,
    bool? emergencyStop,
  }) {
    return AutomationSettings(
      maniGlobalEnabled: maniGlobalEnabled ?? this.maniGlobalEnabled,
      autoSendEnabled: autoSendEnabled ?? this.autoSendEnabled,
      activeProvider: activeProvider ?? this.activeProvider,
      replyDelaySeconds: replyDelaySeconds ?? this.replyDelaySeconds,
      quietHoursEnabled: quietHoursEnabled ?? this.quietHoursEnabled,
      emergencyStop: emergencyStop ?? this.emergencyStop,
      lastWebhookTimestamp: lastWebhookTimestamp,
      lastEventReceived: lastEventReceived,
      lastSuccessfulSend: lastSuccessfulSend,
      lastDeliveryFailure: lastDeliveryFailure,
      updatedAt: updatedAt,
    );
  }
}

class WhatsAppConnectionSession {
  final String? sessionId;
  final String status; // not_configured, connecting, qr_ready, connected, expired, disconnected, error
  final String? qrPayload;
  final String? expiresAt;
  final String? connectedPhone;
  final String? connectedAt;
  final String? error;
  final String? message;
  final List<String> instructions;

  const WhatsAppConnectionSession({
    this.sessionId,
    required this.status,
    this.qrPayload,
    this.expiresAt,
    this.connectedPhone,
    this.connectedAt,
    this.error,
    this.message,
    this.instructions = const [
      'Open WhatsApp on your phone',
      'Tap Menu (Android ⋮) or Settings (iOS ⚙)',
      'Select "Linked Devices"',
      'Tap "Link a Device"',
      'Point your camera at this QR code to scan'
    ],
  });

  factory WhatsAppConnectionSession.fromJson(Map<String, dynamic> json) {
    return WhatsAppConnectionSession(
      sessionId: json['sessionId'] as String?,
      status: json['status'] as String? ?? 'not_configured',
      qrPayload: json['qrPayload'] as String?,
      expiresAt: json['expiresAt'] as String?,
      connectedPhone: json['connectedPhone'] as String?,
      connectedAt: json['connectedAt'] as String?,
      error: json['error'] as String?,
      message: json['message'] as String?,
      instructions: (json['instructions'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [
            'Open WhatsApp on your phone',
            'Tap Menu (Android ⋮) or Settings (iOS ⚙)',
            'Select "Linked Devices"',
            'Tap "Link a Device"',
            'Point your camera at this QR code to scan'
          ],
    );
  }
}
