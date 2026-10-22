import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../models/contact.dart';
import '../models/draft.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/state_views.dart';

class ReplyStudioScreen extends StatefulWidget {
  final ApiService apiService;

  const ReplyStudioScreen({super.key, required this.apiService});

  @override
  State<ReplyStudioScreen> createState() => _ReplyStudioScreenState();
}

class _ReplyStudioScreenState extends State<ReplyStudioScreen> {
  final TextEditingController _incomingController = TextEditingController();
  final TextEditingController _contextController = TextEditingController();
  final TextEditingController _replyController = TextEditingController();

  List<Contact> _contacts = [];
  Contact? _selectedContact;
  ReplyDraft? _currentDraft;

  bool _loadingContacts = false;
  bool _generating = false;
  String? _errorMessage;
  String? _successBanner;

  @override
  void initState() {
    super.initState();
    _loadContacts();
  }

  @override
  void dispose() {
    _incomingController.dispose();
    _contextController.dispose();
    _replyController.dispose();
    super.dispose();
  }

  Future<void> _loadContacts() async {
    setState(() {
      _loadingContacts = true;
      _errorMessage = null;
    });

    try {
      final list = await widget.apiService.getContacts();
      if (!mounted) return;
      setState(() {
        _contacts = list;
        if (list.isNotEmpty && _selectedContact == null) {
          _selectedContact = list.first;
        } else if (_selectedContact != null) {
          _selectedContact = list.firstWhere(
            (c) => c.id == _selectedContact!.id,
            orElse: () => list.first,
          );
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _loadingContacts = false);
    }
  }

  Future<void> _generateReply() async {
    if (_selectedContact == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select or create a contact first')),
      );
      return;
    }

    final message = _incomingController.text.trim();
    if (message.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Incoming message cannot be empty')),
      );
      return;
    }

    setState(() {
      _generating = true;
      _errorMessage = null;
      _successBanner = null;
    });

    try {
      final draft = await widget.apiService.generateReply(
        contactId: _selectedContact!.id,
        incomingMessage: message,
        optionalContext: _contextController.text.trim().isNotEmpty
            ? _contextController.text.trim()
            : null,
      );

      if (!mounted) return;
      setState(() {
        _currentDraft = draft;
        _replyController.text = draft.generatedReply;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _generating = false);
    }
  }

  Future<void> _updateStatus(String status) async {
    if (_currentDraft == null) return;

    try {
      final updated = await widget.apiService.updateDraftStatus(
        draftId: _currentDraft!.id,
        reviewStatus: status,
        editedReply: _replyController.text != _currentDraft!.generatedReply
            ? _replyController.text
            : null,
      );
      if (!mounted) return;
      setState(() {
        _currentDraft = updated;
        _successBanner = 'Draft marked as $status.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    }
  }

  Future<void> _copyReply() async {
    final text = _replyController.text.trim();
    if (text.isEmpty) return;

    await Clipboard.setData(ClipboardData(text: text));
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Copied reply draft to clipboard')),
    );
    await _updateStatus('copied');
  }

  Future<void> _shareReply() async {
    final text = _replyController.text.trim();
    if (text.isEmpty) return;

    try {
      await SharePlus.instance.share(ShareParams(text: text));
      await _updateStatus('shared');
    } catch (_) {
      // User cancelled
    }
  }

  Future<void> _submitFeedback(String rating) async {
    if (_currentDraft == null) return;

    try {
      await widget.apiService.submitDraftFeedback(
        draftId: _currentDraft!.id,
        rating: rating,
        ownerCorrection: _replyController.text != _currentDraft!.generatedReply
            ? _replyController.text
            : null,
      );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Feedback saved to style memory')),
      );
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Reply Studio'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            tooltip: 'Refresh Contacts',
            onPressed: _loadContacts,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Error Banner
            if (_errorMessage != null)
              ErrorBannerView(
                message: _errorMessage!,
                onRetry: _loadContacts,
              ),

            // Success Banner
            if (_successBanner != null)
              Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppTheme.emeraldMuted.withValues(alpha: 0.35),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppTheme.emerald.withValues(alpha: 0.6)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.check_circle_outline, size: 16, color: AppTheme.emerald),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _successBanner!,
                        style: const TextStyle(fontSize: 12, color: AppTheme.emerald),
                      ),
                    ),
                    GestureDetector(
                      onTap: () => setState(() => _successBanner = null),
                      child: const Icon(Icons.close, size: 14, color: AppTheme.emerald),
                    ),
                  ],
                ),
              ),

            // Card 1: Input & Configuration
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
                      Icon(Icons.chat_bubble_outline, size: 16, color: AppTheme.textSecondary),
                      SizedBox(width: 8),
                      Text(
                        'Generate Contextual Reply',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Contact Picker
                  const Text('Recipient Contact', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: AppTheme.background,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: _loadingContacts
                        ? const Padding(
                            padding: EdgeInsets.symmetric(vertical: 12),
                            child: SizedBox(
                              height: 16,
                              width: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            ),
                          )
                        : DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedContact?.id,
                              hint: const Text('No contacts found', style: TextStyle(fontSize: 13, color: AppTheme.textMuted)),
                              isExpanded: true,
                              dropdownColor: AppTheme.surfaceElevated,
                              items: _contacts.map((c) {
                                return DropdownMenuItem<String>(
                                  value: c.id,
                                  child: Text(
                                    '${c.name} (${c.relationshipFormatted}) • ${c.toneFormatted}',
                                    style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                                  ),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedContact = _contacts.firstWhere((c) => c.id == val);
                                  });
                                }
                              },
                            ),
                          ),
                  ),
                  if (_selectedContact != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Text(
                          'Tone: ${_selectedContact!.toneFormatted}',
                          style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: _selectedContact!.isPaused
                                ? AppTheme.amberMuted.withValues(alpha: 0.4)
                                : AppTheme.emeraldMuted.withValues(alpha: 0.4),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            _selectedContact!.isPaused ? 'Paused' : 'Active',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: _selectedContact!.isPaused
                                  ? AppTheme.amber
                                  : AppTheme.emerald,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 16),

                  // Incoming Message
                  const Text('Incoming Message (Authorized Input)', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _incomingController,
                    maxLines: 3,
                    style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                    decoration: const InputDecoration(
                      hintText: 'e.g. Free today for kopi at 1pm?',
                      fillColor: AppTheme.background,
                    ),
                  ),
                  const SizedBox(height: 14),

                  // Guidance Context
                  const Text('Optional Guidance Context (Private)', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _contextController,
                    style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                    decoration: const InputDecoration(
                      hintText: 'e.g. Reach in 10 mins, order drinks first',
                      fillColor: AppTheme.background,
                    ),
                  ),
                  const SizedBox(height: 18),

                  // Generate Button
                  ElevatedButton(
                    onPressed: _generating ? null : _generateReply,
                    child: _generating
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.black),
                          )
                        : const Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.auto_awesome, size: 16),
                              SizedBox(width: 8),
                              Text('Generate Authentic Reply'),
                            ],
                          ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Strict Safety Notice Banner
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.surfaceElevated.withValues(alpha: 0.5),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppTheme.borderSubtle),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.shield_outlined, size: 16, color: AppTheme.emerald),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Strict Safety Notice: Mani never impersonates unofficial WhatsApp sockets or sends unauthorized background messages. All replies require owner review and use native copy/share sheet controls.',
                      style: TextStyle(fontSize: 11, color: AppTheme.textMuted, height: 1.35),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Card 2: Generated Reply & Safety Banner (If present)
            if (_replyController.text.isNotEmpty || _currentDraft != null) ...[
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
                    Row(
                      children: [
                        const Icon(Icons.edit_note, size: 18, color: AppTheme.textSecondary),
                        const SizedBox(width: 8),
                        const Text(
                          'Reply Studio & Human Review',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const Spacer(),
                        if (_currentDraft != null)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceElevated,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: Text(
                              'Status: ${_currentDraft!.reviewStatus.toUpperCase()}',
                              style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary, fontWeight: FontWeight.bold),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Deterministic Safety Assessment Card
                    if (_currentDraft != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: _currentDraft!.safetyCheck.isSafe
                              ? AppTheme.emeraldMuted.withValues(alpha: 0.25)
                              : AppTheme.roseMuted.withValues(alpha: 0.25),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: _currentDraft!.safetyCheck.isSafe
                                ? AppTheme.emerald.withValues(alpha: 0.5)
                                : AppTheme.rose.withValues(alpha: 0.5),
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  _currentDraft!.safetyCheck.isSafe
                                      ? Icons.check_circle_outline
                                      : Icons.warning_amber_rounded,
                                  size: 16,
                                  color: _currentDraft!.safetyCheck.isSafe
                                      ? AppTheme.emerald
                                      : AppTheme.rose,
                                ),
                                const SizedBox(width: 6),
                                Text(
                                  _currentDraft!.safetyCheck.isSafe
                                      ? 'Safety Check: Passed'
                                      : 'Safety Check: Risk Flagged',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: _currentDraft!.safetyCheck.isSafe
                                        ? AppTheme.emerald
                                        : AppTheme.rose,
                                  ),
                                ),
                                const Spacer(),
                                Text(
                                  'Review Required: ${_currentDraft!.safetyCheck.requiresManualReview ? "YES" : "NO"}',
                                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              _currentDraft!.safetyCheck.reason,
                              style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                            ),
                            if (_currentDraft!.safetyCheck.riskFlags.isNotEmpty) ...[
                              const SizedBox(height: 6),
                              Wrap(
                                spacing: 4,
                                children: _currentDraft!.safetyCheck.riskFlags.map((flag) {
                                  return Chip(
                                    label: Text(flag, style: const TextStyle(fontSize: 10, color: AppTheme.rose)),
                                    backgroundColor: AppTheme.roseMuted.withValues(alpha: 0.5),
                                    padding: EdgeInsets.zero,
                                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    side: BorderSide.none,
                                  );
                                }).toList(),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),
                    ],

                    // Editable Reply Draft Box
                    const Text('Draft (Owner Editable)', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: _replyController,
                      maxLines: 4,
                      style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary, height: 1.4),
                      decoration: const InputDecoration(
                        fillColor: AppTheme.background,
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Actions: Copy, Share, Approve, Reject
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _copyReply,
                            icon: const Icon(Icons.copy, size: 16),
                            label: const Text('Copy'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: _shareReply,
                            icon: const Icon(Icons.share, size: 16),
                            label: const Text('Share'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _updateStatus('approved'),
                            icon: const Icon(Icons.check, size: 16),
                            label: const Text('Approve Draft'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.emeraldMuted,
                              foregroundColor: AppTheme.emerald,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () => _updateStatus('rejected'),
                            icon: const Icon(Icons.close, size: 16),
                            label: const Text('Reject Draft'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.roseMuted,
                              foregroundColor: AppTheme.rose,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Continuous Learning / Tone Feedback
                    const Divider(),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        const Text('Rate this tone:', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                        const Spacer(),
                        InkWell(
                          onTap: () => _submitFeedback('helpful'),
                          borderRadius: BorderRadius.circular(6),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceElevated,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.thumb_up, size: 12, color: AppTheme.emerald),
                                SizedBox(width: 4),
                                Text('Accurate', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        InkWell(
                          onTap: () => _submitFeedback('needs_improvement'),
                          borderRadius: BorderRadius.circular(6),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceElevated,
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(color: AppTheme.border),
                            ),
                            child: const Row(
                              children: [
                                Icon(Icons.thumb_down, size: 12, color: AppTheme.amber),
                                SizedBox(width: 4),
                                Text('Needs Fix', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
