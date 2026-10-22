class QuietHours {
  final bool enabled;
  final String start;
  final String end;
  final String timezone;

  const QuietHours({
    this.enabled = false,
    this.start = '22:00',
    this.end = '08:00',
    this.timezone = 'UTC',
  });

  factory QuietHours.fromJson(Map<String, dynamic> json) {
    return QuietHours(
      enabled: json['enabled'] as bool? ?? false,
      start: json['start'] as String? ?? '22:00',
      end: json['end'] as String? ?? '08:00',
      timezone: json['timezone'] as String? ?? 'UTC',
    );
  }

  Map<String, dynamic> toJson() => {
    'enabled': enabled,
    'start': start,
    'end': end,
    'timezone': timezone,
  };
}

class Contact {
  final String id;
  final String name;
  final String? phoneNumber;
  final String relationship; // romantic_partner, boss_or_manager, friend, family_member, custom
  final String preferredTone; // casual, professional, warm_and_affectionate, respectful, humorous_playful, neutral_direct
  final String? customRelationshipNotes;
  final List<String> allowedCategories;
  final bool autoSendEnabled;
  final QuietHours quietHours;
  final bool sensitiveTopicsRequireReview;
  final bool isPaused;
  final String? createdAt;
  final String? updatedAt;

  const Contact({
    required this.id,
    required this.name,
    this.phoneNumber,
    this.relationship = 'friend',
    this.preferredTone = 'casual',
    this.customRelationshipNotes,
    this.allowedCategories = const ['general_chat', 'scheduling_plans'],
    this.autoSendEnabled = false,
    this.quietHours = const QuietHours(),
    this.sensitiveTopicsRequireReview = true,
    this.isPaused = false,
    this.createdAt,
    this.updatedAt,
  });

  factory Contact.fromJson(Map<String, dynamic> json) {
    return Contact(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      phoneNumber: json['phoneNumber'] as String?,
      relationship: json['relationship'] as String? ?? 'friend',
      preferredTone: json['preferredTone'] as String? ?? 'casual',
      customRelationshipNotes: json['customRelationshipNotes'] as String?,
      allowedCategories: (json['allowedCategories'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const ['general_chat', 'scheduling_plans'],
      autoSendEnabled: json['autoSendEnabled'] as bool? ?? false,
      quietHours: json['quietHours'] is Map<String, dynamic>
          ? QuietHours.fromJson(json['quietHours'] as Map<String, dynamic>)
          : const QuietHours(),
      sensitiveTopicsRequireReview:
          json['sensitiveTopicsRequireReview'] as bool? ?? true,
      isPaused: json['isPaused'] as bool? ?? false,
      createdAt: json['createdAt'] as String?,
      updatedAt: json['updatedAt'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    if (phoneNumber != null) 'phoneNumber': phoneNumber,
    'relationship': relationship,
    'preferredTone': preferredTone,
    if (customRelationshipNotes != null)
      'customRelationshipNotes': customRelationshipNotes,
    'allowedCategories': allowedCategories,
    'autoSendEnabled': autoSendEnabled,
    'quietHours': quietHours.toJson(),
    'sensitiveTopicsRequireReview': sensitiveTopicsRequireReview,
    'isPaused': isPaused,
    if (createdAt != null) 'createdAt': createdAt,
    if (updatedAt != null) 'updatedAt': updatedAt,
  };

  Contact copyWith({
    String? name,
    String? phoneNumber,
    String? relationship,
    String? preferredTone,
    String? customRelationshipNotes,
    List<String>? allowedCategories,
    bool? autoSendEnabled,
    QuietHours? quietHours,
    bool? sensitiveTopicsRequireReview,
    bool? isPaused,
  }) {
    return Contact(
      id: id,
      name: name ?? this.name,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      relationship: relationship ?? this.relationship,
      preferredTone: preferredTone ?? this.preferredTone,
      customRelationshipNotes:
          customRelationshipNotes ?? this.customRelationshipNotes,
      allowedCategories: allowedCategories ?? this.allowedCategories,
      autoSendEnabled: autoSendEnabled ?? this.autoSendEnabled,
      quietHours: quietHours ?? this.quietHours,
      sensitiveTopicsRequireReview:
          sensitiveTopicsRequireReview ?? this.sensitiveTopicsRequireReview,
      isPaused: isPaused ?? this.isPaused,
      createdAt: createdAt,
      updatedAt: updatedAt,
    );
  }

  String get relationshipFormatted {
    switch (relationship) {
      case 'romantic_partner':
        return 'Romantic Partner';
      case 'boss_or_manager':
        return 'Boss / Manager';
      case 'friend':
        return 'Friend';
      case 'family_member':
        return 'Family Member';
      default:
        return 'Custom';
    }
  }

  String get toneFormatted {
    switch (preferredTone) {
      case 'casual':
        return 'Casual';
      case 'professional':
        return 'Professional';
      case 'warm_and_affectionate':
        return 'Warm & Affectionate';
      case 'respectful':
        return 'Respectful';
      case 'humorous_playful':
        return 'Humorous & Playful';
      case 'neutral_direct':
        return 'Neutral & Direct';
      default:
        return preferredTone;
    }
  }
}
