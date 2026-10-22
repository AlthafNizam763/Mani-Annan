import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/state_views.dart';

class ChatImportScreen extends StatefulWidget {
  final ApiService apiService;
  final VoidCallback? onStyleUpdated;

  const ChatImportScreen({
    super.key,
    required this.apiService,
    this.onStyleUpdated,
  });

  @override
  State<ChatImportScreen> createState() => _ChatImportScreenState();
}

class _ChatImportScreenState extends State<ChatImportScreen> {
  final TextEditingController _ownerCtrl = TextEditingController(text: 'Alex');
  final TextEditingController _contactCtrl = TextEditingController();
  final TextEditingController _chatCtrl = TextEditingController(
    text: '''[10/14/26, 14:05:10] Alex: Bro you reaching soon?
[10/14/26, 14:06:00] Sam: Yes, 5 mins away!
[10/14/26, 14:06:25] Alex: Steady lah, I already ordered kopi...
[10/14/26, 14:07:00] Sam: Nice! 👍
[10/14/26, 14:07:30] Alex: Ok see you!''',
  );

  bool _consentConfirmed = true;
  bool _importing = false;
  Map<String, dynamic>? _lastResult;
  String? _errorMessage;
  List<dynamic> _pastImports = [];

  @override
  void initState() {
    super.initState();
    _loadPastImports();
  }

  @override
  void dispose() {
    _ownerCtrl.dispose();
    _contactCtrl.dispose();
    _chatCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadPastImports() async {
    try {
      final list = await widget.apiService.getImports();
      if (!mounted) return;
      setState(() => _pastImports = list);
    } catch (_) {
      // ignore
    }
  }

  Future<void> _runImport() async {
    final owner = _ownerCtrl.text.trim();
    final rawText = _chatCtrl.text.trim();

    if (owner.isEmpty || rawText.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your sender name and chat export content')),
      );
      return;
    }

    if (!_consentConfirmed) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Explicit user authorization and consent is mandatory')),
      );
      return;
    }

    setState(() {
      _importing = true;
      _errorMessage = null;
    });

    try {
      final res = await widget.apiService.importChat(
        rawText: rawText,
        ownerIdentifier: owner,
        contactName: _contactCtrl.text.trim().isNotEmpty ? _contactCtrl.text.trim() : null,
      );

      if (!mounted) return;
      setState(() {
        _lastResult = res;
      });
      _loadPastImports();
      widget.onStyleUpdated?.call();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Chat imported and personal style profile calibrated!')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _importing = false);
    }
  }

  Future<void> _deleteImport(String id) async {
    try {
      await widget.apiService.deleteImport(id);
      if (!mounted) return;
      setState(() => _pastImports.removeWhere((i) => i['id'] == id));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Import batch and derived examples removed')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Delete failed: ${e.toString()}')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Chat Import & Calibration'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            if (_errorMessage != null)
              ErrorBannerView(message: _errorMessage!),

            // Card 1: Import Form
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.surface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppTheme.border),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.upload_file_outlined, size: 16, color: AppTheme.emerald),
                      SizedBox(width: 8),
                      Text(
                        'Authorized Chat History Import',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Paste exported WhatsApp chats (.txt) you are authorized to use. Mani isolates your outgoing messages from contact messages. Counterparty messages are never treated as examples of your writing style.',
                    style: TextStyle(fontSize: 12, color: AppTheme.textMuted, height: 1.35),
                  ),
                  const SizedBox(height: 16),

                  // Sender Identifier
                  const Text('Your Sender Name (Owner in Chat) *', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _ownerCtrl,
                    style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                    decoration: const InputDecoration(
                      hintText: 'e.g. Alex',
                      fillColor: AppTheme.background,
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Chat Content
                  const Text('Exported Chat Content (.txt format) *', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _chatCtrl,
                    maxLines: 7,
                    style: const TextStyle(fontSize: 12, fontFamily: 'monospace', color: AppTheme.textPrimary),
                    decoration: const InputDecoration(
                      fillColor: AppTheme.background,
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Consent Checkbox
                  InkWell(
                    onTap: () => setState(() => _consentConfirmed = !_consentConfirmed),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Checkbox(
                          value: _consentConfirmed,
                          activeColor: AppTheme.emerald,
                          onChanged: (val) => setState(() => _consentConfirmed = val ?? false),
                        ),
                        const Expanded(
                          child: Padding(
                            padding: EdgeInsets.only(top: 8.0),
                            child: Text(
                              'I confirm that I own or am explicitly authorized to import this conversation history for personal style calibration.',
                              style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, height: 1.3),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Submit
                  ElevatedButton(
                    onPressed: _importing ? null : _runImport,
                    child: _importing
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                          )
                        : const Text('Extract Style & Calibrate'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Card 2: Last Extraction Result (If just imported)
            if (_lastResult != null) ...[
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.emeraldMuted.withValues(alpha: 0.25),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: AppTheme.emerald.withValues(alpha: 0.5)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.check_circle_outline, size: 16, color: AppTheme.emerald),
                        SizedBox(width: 8),
                        Text(
                          'Style Extraction Results',
                          style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.emerald),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    Text(
                      _lastResult!['summary'] ?? 'Style profile calibrated successfully.',
                      style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        _resultStat(
                          'Owner Msgs',
                          '${_lastResult!['extractedOwnerMessagesCount'] ?? 0}',
                        ),
                        const SizedBox(width: 12),
                        _resultStat(
                          'Counterparty Msgs',
                          '${_lastResult!['extractedContactMessagesCount'] ?? 0}',
                        ),
                      ],
                    ),
                    if (_lastResult!['detectedSlang'] is List &&
                        (_lastResult!['detectedSlang'] as List).isNotEmpty) ...[
                      const SizedBox(height: 10),
                      const Text('Detected Slang Markers:', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                      const SizedBox(height: 4),
                      Wrap(
                        spacing: 6,
                        runSpacing: 4,
                        children: (_lastResult!['detectedSlang'] as List).map((s) {
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceElevated,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              s.toString(),
                              style: const TextStyle(fontSize: 11, color: AppTheme.emerald, fontWeight: FontWeight.bold),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Past Imports List
            if (_pastImports.isNotEmpty) ...[
              const Text('Import History', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
              const SizedBox(height: 8),
              ..._pastImports.map((imp) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppTheme.surface,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppTheme.border),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.history, size: 16, color: AppTheme.textMuted),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Imported as ${imp['ownerIdentifier']}',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${imp['extractedOwnerCount']} owner messages extracted • ${imp['status']}',
                              style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline, size: 16, color: AppTheme.rose),
                        onPressed: () => _deleteImport(imp['id']),
                        tooltip: 'Delete Import Batch',
                      ),
                    ],
                  ),
                );
              }),
            ],
          ],
        ),
      ),
    );
  }

  Widget _resultStat(String label, String value) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Text('$label: ', style: const TextStyle(fontSize: 11, color: AppTheme.textMuted)),
          Text(value, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white)),
        ],
      ),
    );
  }
}
