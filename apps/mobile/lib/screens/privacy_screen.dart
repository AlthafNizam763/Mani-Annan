import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/state_views.dart';

class PrivacyScreen extends StatefulWidget {
  final ApiService apiService;
  final AuthService authService;

  const PrivacyScreen({
    super.key,
    required this.apiService,
    required this.authService,
  });

  @override
  State<PrivacyScreen> createState() => _PrivacyScreenState();
}

class _PrivacyScreenState extends State<PrivacyScreen> {
  final TextEditingController _urlCtrl = TextEditingController();
  bool _exporting = false;
  bool _purging = false;
  String? _statusMessage;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _urlCtrl.text = widget.apiService.baseUrl;
  }

  @override
  void dispose() {
    _urlCtrl.dispose();
    super.dispose();
  }

  void _saveApiUrl() {
    final url = _urlCtrl.text.trim();
    if (url.isNotEmpty) {
      widget.apiService.baseUrl = url;
      setState(() => _statusMessage = 'API URL updated to $url');
    }
  }

  Future<void> _exportData() async {
    setState(() {
      _exporting = true;
      _errorMessage = null;
      _statusMessage = null;
    });

    try {
      final data = await widget.apiService.exportData();
      final jsonString = const JsonEncoder.withIndent('  ').convert(data['data'] ?? data);

      if (!mounted) return;
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppTheme.surface,
          title: const Text('Data Sovereignty Export', style: TextStyle(color: AppTheme.textPrimary, fontSize: 15)),
          content: SizedBox(
            width: double.maxFinite,
            height: 350,
            child: SingleChildScrollView(
              child: SelectableText(
                jsonString,
                style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: AppTheme.textSecondary),
              ),
            ),
          ),
          actions: [
            OutlinedButton.icon(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: jsonString));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Export JSON copied to clipboard')),
                );
              },
              icon: const Icon(Icons.copy, size: 14),
              label: const Text('Copy JSON'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _exporting = false);
    }
  }

  Future<void> _purgeData() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: const Row(
          children: [
            Icon(Icons.delete_forever, color: AppTheme.rose),
            SizedBox(width: 8),
            Text('Permanently Purge Data', style: TextStyle(color: AppTheme.textPrimary, fontSize: 15)),
          ],
        ),
        content: const Text(
          'Are you sure you want to permanently delete all personal data, style profiles, chat imports, drafts, and examples? This cannot be undone and complies with full GDPR/PDPA erasure sovereignty.',
          style: TextStyle(color: AppTheme.textSecondary, fontSize: 13, height: 1.35),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.rose,
              foregroundColor: Colors.white,
            ),
            child: const Text('ERASE EVERYTHING'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      setState(() {
        _purging = true;
        _errorMessage = null;
      });

      try {
        await widget.apiService.purgeAllData();
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('All personal data has been permanently erased.')),
        );
        widget.authService.signOut();
      } catch (e) {
        if (!mounted) return;
        setState(() => _errorMessage = e.toString());
      } finally {
        if (mounted) setState(() => _purging = false);
      }
    }
  }

  void _signOut() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: const Text('Sign Out', style: TextStyle(color: AppTheme.textPrimary)),
        content: const Text('Are you sure you want to sign out of this session?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              widget.authService.signOut();
            },
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = widget.authService.user;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Privacy & Settings'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_errorMessage != null)
              ErrorBannerView(message: _errorMessage!),

            if (_statusMessage != null) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.border),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_outline, size: 16, color: AppTheme.emerald),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(_statusMessage!, style: const TextStyle(fontSize: 12, color: AppTheme.emerald)),
                    ),
                  ],
                ),
              ),
            ],

            // Section 1: User Account
            _sectionTitle('Owner Account', Icons.person_outline),
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
                  Row(
                    children: [
                      const CircleAvatar(
                        radius: 18,
                        backgroundColor: AppTheme.surfaceElevated,
                        child: Icon(Icons.person, size: 20, color: Colors.white),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?.displayName ?? 'Project Owner',
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                            ),
                            Text(
                              user?.email ?? 'Unauthenticated',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      ),
                      OutlinedButton.icon(
                        onPressed: _signOut,
                        icon: const Icon(Icons.logout, size: 14),
                        label: const Text('Sign Out'),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          textStyle: const TextStyle(fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    'UID: ${user?.uid ?? "N/A"}',
                    style: const TextStyle(fontSize: 10, fontFamily: 'monospace', color: AppTheme.textMuted),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Section 2: Data Sovereignty Controls
            _sectionTitle('Data Sovereignty & Privacy Controls', Icons.shield_outlined),
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
                  const Text(
                    'You retain complete ownership of all style data, conversation examples, and contact policies. Data can be exported as a portable JSON package or wiped out permanently at any time.',
                    style: TextStyle(fontSize: 12, color: AppTheme.textMuted, height: 1.35),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _exporting ? null : _exportData,
                          icon: _exporting
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Icon(Icons.download, size: 16),
                          label: const Text('Export All Data'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _purging ? null : _purgeData,
                          icon: _purging
                              ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Icon(Icons.delete_forever, size: 16),
                          label: const Text('Purge All Data'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppTheme.roseMuted,
                            foregroundColor: AppTheme.rose,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Section 3: Backend API Endpoint Setting
            _sectionTitle('Backend API Endpoint', Icons.dns_outlined),
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
                  const Text(
                    'Configure the backend host URL for local emulator or network deployment:',
                    style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _urlCtrl,
                          style: const TextStyle(fontSize: 12, fontFamily: 'monospace', color: AppTheme.textPrimary),
                          decoration: const InputDecoration(
                            fillColor: AppTheme.background,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: _saveApiUrl,
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                        child: const Text('Save'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    children: [
                      ActionChip(
                        label: const Text('10.0.2.2:4001 (Android Emulator)', style: TextStyle(fontSize: 10)),
                        backgroundColor: AppTheme.surfaceElevated,
                        onPressed: () {
                          _urlCtrl.text = 'http://10.0.2.2:4001/api/v1';
                          _saveApiUrl();
                        },
                      ),
                      ActionChip(
                        label: const Text('localhost:4001 (Desktop/Web)', style: TextStyle(fontSize: 10)),
                        backgroundColor: AppTheme.surfaceElevated,
                        onPressed: () {
                          _urlCtrl.text = 'http://localhost:4001/api/v1';
                          _saveApiUrl();
                        },
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Section 4: Security Architecture Highlights
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.surfaceElevated.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.borderSubtle),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Safety & Security Architecture Highlights:',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                  ),
                  SizedBox(height: 6),
                  Text('• Deterministic safety filters run outside the LLM to prevent monetary hallucination and PII leakage.', style: TextStyle(fontSize: 11, color: AppTheme.textMuted, height: 1.3)),
                  SizedBox(height: 3),
                  Text('• Firebase Admin SDK verifies user identity from tokens; client body IDs are never trusted.', style: TextStyle(fontSize: 11, color: AppTheme.textMuted, height: 1.3)),
                  SizedBox(height: 3),
                  Text('• Firestore Security Rules strictly enforce per-user isolation under users/{uid}.', style: TextStyle(fontSize: 11, color: AppTheme.textMuted, height: 1.3)),
                  SizedBox(height: 3),
                  Text('• Zero reliance on unofficial WhatsApp automation libraries or socket hooks.', style: TextStyle(fontSize: 11, color: AppTheme.textMuted, height: 1.3)),
                ],
              ),
            ),
          ],
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
}
