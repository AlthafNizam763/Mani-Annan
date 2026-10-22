class StyleProfile {
  final int version;
  final List<String> primaryLanguages;
  final bool usesManglish;
  final List<String> commonSlang;
  final String avgSentenceLength;
  final bool omitsEndingPeriod;
  final bool usesEllipsis;
  final List<String> frequentEmojis;
  final String emojiFrequency;
  final String? updatedAt;

  StyleProfile({
    this.version = 1,
    this.primaryLanguages = const ['en'],
    this.usesManglish = true,
    this.commonSlang = const ['lah', 'bro', 'dey', 'machan', 'ok ok'],
    this.avgSentenceLength = 'short',
    this.omitsEndingPeriod = true,
    this.usesEllipsis = true,
    this.frequentEmojis = const ['👍', '😂'],
    this.emojiFrequency = 'moderate',
    this.updatedAt,
  });

  factory StyleProfile.fromJson(Map<String, dynamic> json) {
    final habits = json['punctuationHabits'] as Map<String, dynamic>? ?? {};
    final emojis = json['emojiHabits'] as Map<String, dynamic>? ?? {};

    return StyleProfile(
      version: json['version'] is int ? json['version'] : 1,
      primaryLanguages: (json['primaryLanguages'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? ['en'],
      usesManglish: json['usesManglish'] as bool? ?? true,
      commonSlang: (json['commonSlang'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? ['lah', 'bro', 'dey'],
      avgSentenceLength: json['avgSentenceLength'] as String? ?? 'short',
      omitsEndingPeriod: habits['omitsEndingPeriod'] as bool? ?? true,
      usesEllipsis: habits['usesEllipsis'] as bool? ?? true,
      frequentEmojis: (emojis['frequentEmojis'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? ['👍', '😂'],
      emojiFrequency: emojis['emojiFrequency'] as String? ?? 'moderate',
      updatedAt: json['updatedAt'] as String?,
    );
  }
}

class UserProfile {
  final String uid;
  final String email;
  final String? displayName;
  final StyleProfile? styleProfile;

  UserProfile({
    required this.uid,
    required this.email,
    this.displayName,
    this.styleProfile,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      uid: json['uid'] as String? ?? '',
      email: json['email'] as String? ?? '',
      displayName: json['displayName'] as String?,
      styleProfile: json['styleProfile'] != null
          ? StyleProfile.fromJson(json['styleProfile'] as Map<String, dynamic>)
          : null,
    );
  }
}
