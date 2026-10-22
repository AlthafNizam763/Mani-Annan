import 'package:flutter/material.dart';
import '../models/user_profile.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/state_views.dart';

class StyleProfileScreen extends StatefulWidget {
  final ApiService apiService;

  const StyleProfileScreen({super.key, required this.apiService});

  @override
  State<StyleProfileScreen> createState() => _StyleProfileScreenState();
}

class _StyleProfileScreenState extends State<StyleProfileScreen> {
  UserProfile? _userProfile;
  bool _loading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final p = await widget.apiService.getMe();
      if (!mounted) return;
      setState(() => _userProfile = p);
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final style = _userProfile?.styleProfile;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Writing-Style Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _loadProfile,
          ),
        ],
      ),
      body: _loading && _userProfile == null
          ? const LoadingStateView(message: 'Loading style calibration...')
          : _errorMessage != null && _userProfile == null
              ? ErrorBannerView(message: _errorMessage!, onRetry: _loadProfile)
              : RefreshIndicator(
                  onRefresh: _loadProfile,
                  color: Colors.white,
                  backgroundColor: AppTheme.surfaceElevated,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (_errorMessage != null)
                          ErrorBannerView(message: _errorMessage!, onRetry: _loadProfile),

                        // Section 1: Languages & Slang
                        _sectionTitle('Language Mix & Slang Markers', Icons.translate),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppTheme.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _infoRow('Languages', style?.primaryLanguages.join(', ') ?? 'English (en)'),
                              const SizedBox(height: 8),
                              _infoRow('Manglish Usage', style?.usesManglish == true ? 'Active (Integrated)' : 'Disabled'),
                              const SizedBox(height: 12),
                              const Text('Common Slang & Fillers:', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                              const SizedBox(height: 6),
                              Wrap(
                                spacing: 6,
                                runSpacing: 4,
                                children: (style?.commonSlang ?? ['lah', 'bro', 'machan', 'dey']).map((slang) {
                                  return Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppTheme.surfaceElevated,
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(color: AppTheme.borderSubtle),
                                    ),
                                    child: Text(
                                      slang,
                                      style: const TextStyle(fontSize: 11, color: AppTheme.textPrimary, fontFamily: 'monospace'),
                                    ),
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Section 2: Punctuation & Sentence Structure
                        _sectionTitle('Sentence Structure & Habits', Icons.format_quote),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppTheme.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Column(
                            children: [
                              _infoRow('Average Sentence Length', (style?.avgSentenceLength ?? 'short').toUpperCase()),
                              const SizedBox(height: 8),
                              _infoRow('Omits Trailing Period', style?.omitsEndingPeriod == true ? 'Yes (Casual habit)' : 'No'),
                              const SizedBox(height: 8),
                              _infoRow('Uses Ellipsis (...)', style?.usesEllipsis == true ? 'Yes (Frequent)' : 'No'),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Section 3: Emoji Habits
                        _sectionTitle('Emoji Habits', Icons.emoji_emotions_outlined),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppTheme.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              _infoRow('Emoji Frequency', (style?.emojiFrequency ?? 'moderate').toUpperCase()),
                              const SizedBox(height: 10),
                              const Text('Frequent Emojis:', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                              const SizedBox(height: 6),
                              Row(
                                children: (style?.frequentEmojis ?? ['👍', '😂', '🔥']).map((e) {
                                  return Container(
                                    margin: const EdgeInsets.only(right: 8),
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: AppTheme.surfaceElevated,
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(e, style: const TextStyle(fontSize: 18)),
                                  );
                                }).toList(),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Section 4: Engine Version & Provenance
                        _sectionTitle('Engine & Calibration Provenance', Icons.memory),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(
                            color: AppTheme.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppTheme.border),
                          ),
                          child: Column(
                            children: [
                              _infoRow('Model Profile Version', 'v${style?.version ?? 1}'),
                              const SizedBox(height: 8),
                              _infoRow(
                                'Last Calibrated',
                                style?.updatedAt != null
                                    ? DateTime.tryParse(style!.updatedAt!)?.toLocal().toString().split('.').first ?? style.updatedAt!
                                    : 'Default Initialization',
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _sectionTitle(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppTheme.emerald),
        const SizedBox(width: 6),
        Text(
          title,
          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
        ),
      ],
    );
  }

  Widget _infoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
        Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary)),
      ],
    );
  }
}
