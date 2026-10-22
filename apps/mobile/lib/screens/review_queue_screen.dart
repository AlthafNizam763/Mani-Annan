import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:share_plus/share_plus.dart';
import '../models/draft.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/state_views.dart';

class ReviewQueueScreen extends StatefulWidget {
  final ApiService apiService;

  const ReviewQueueScreen({super.key, required this.apiService});

  @override
  State<ReviewQueueScreen> createState() => _ReviewQueueScreenState();
}

class _ReviewQueueScreenState extends State<ReviewQueueScreen> {
  List<ReplyDraft> _allDrafts = [];
  bool _loading = false;
  String? _errorMessage;
  String _selectedFilter = 'all'; // all, pending, approved, rejected

  @override
  void initState() {
    super.initState();
    _loadDrafts();
  }

  Future<void> _loadDrafts() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final list = await widget.apiService.getDrafts();
      if (!mounted) return;
      setState(() => _allDrafts = list);
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _updateStatus(ReplyDraft draft, String newStatus) async {
    try {
      final updated = await widget.apiService.updateDraftStatus(
        draftId: draft.id,
        reviewStatus: newStatus,
      );
      if (!mounted) return;
      setState(() {
        final idx = _allDrafts.indexWhere((d) => d.id == draft.id);
        if (idx != -1) {
          _allDrafts[idx] = updated;
        }
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Marked as $newStatus')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: ${e.toString()}')),
      );
    }
  }

  List<ReplyDraft> get _filteredDrafts {
    if (_selectedFilter == 'all') return _allDrafts;
    if (_selectedFilter == 'pending') {
      return _allDrafts.where((d) => d.reviewStatus == 'pending').toList();
    }
    if (_selectedFilter == 'approved') {
      return _allDrafts
          .where((d) => d.reviewStatus == 'approved' || d.reviewStatus == 'copied' || d.reviewStatus == 'shared')
          .toList();
    }
    if (_selectedFilter == 'rejected') {
      return _allDrafts.where((d) => d.reviewStatus == 'rejected').toList();
    }
    return _allDrafts;
  }

  @override
  Widget build(BuildContext context) {
    final filtered = _filteredDrafts;

    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Manual-Review Queue'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _loadDrafts,
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter Chips
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: AppTheme.background,
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _filterChip('all', 'All (${_allDrafts.length})'),
                  const SizedBox(width: 8),
                  _filterChip(
                    'pending',
                    'Pending (${_allDrafts.where((d) => d.reviewStatus == 'pending').length})',
                  ),
                  const SizedBox(width: 8),
                  _filterChip(
                    'approved',
                    'Approved (${_allDrafts.where((d) => d.reviewStatus == 'approved' || d.reviewStatus == 'copied' || d.reviewStatus == 'shared').length})',
                  ),
                  const SizedBox(width: 8),
                  _filterChip(
                    'rejected',
                    'Rejected (${_allDrafts.where((d) => d.reviewStatus == 'rejected').length})',
                  ),
                ],
              ),
            ),
          ),
          const Divider(),

          // Main List or States
          Expanded(
            child: _loading && _allDrafts.isEmpty
                ? const LoadingStateView(message: 'Loading review queue...')
                : _errorMessage != null && _allDrafts.isEmpty
                    ? ErrorBannerView(message: _errorMessage!, onRetry: _loadDrafts)
                    : filtered.isEmpty
                        ? EmptyStateView(
                            icon: Icons.checklist_rtl_outlined,
                            title: 'No Drafts in this Queue',
                            description: _selectedFilter == 'pending'
                                ? 'All drafts have been reviewed and approved.'
                                : 'Generate contextual replies from the Studio to populate the review queue.',
                          )
                        : RefreshIndicator(
                            onRefresh: _loadDrafts,
                            color: Colors.white,
                            backgroundColor: AppTheme.surfaceElevated,
                            child: ListView.builder(
                              padding: const EdgeInsets.all(16),
                              itemCount: filtered.length,
                              itemBuilder: (context, idx) {
                                final draft = filtered[idx];
                                return _buildDraftCard(draft);
                              },
                            ),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String filterKey, String label) {
    final isSelected = _selectedFilter == filterKey;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _selectedFilter = filterKey),
      backgroundColor: AppTheme.surface,
      selectedColor: AppTheme.surfaceElevated,
      labelStyle: TextStyle(
        fontSize: 12,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
        color: isSelected ? Colors.white : AppTheme.textMuted,
      ),
      side: BorderSide(
        color: isSelected ? AppTheme.emerald : AppTheme.border,
      ),
    );
  }

  Widget _buildDraftCard(ReplyDraft draft) {
    final isPending = draft.reviewStatus == 'pending';
    final isApproved = draft.reviewStatus == 'approved' || draft.reviewStatus == 'copied' || draft.reviewStatus == 'shared';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isPending ? AppTheme.amber.withValues(alpha: 0.3) : AppTheme.border,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Contact name & Status badge
          Row(
            children: [
              Expanded(
                child: Text(
                  '${draft.contactName} (${draft.relationship})',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                decoration: BoxDecoration(
                  color: isPending
                      ? AppTheme.amberMuted.withValues(alpha: 0.4)
                      : isApproved
                          ? AppTheme.emeraldMuted.withValues(alpha: 0.4)
                          : AppTheme.roseMuted.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Text(
                  draft.reviewStatus.toUpperCase(),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isPending
                        ? AppTheme.amber
                        : isApproved
                            ? AppTheme.emerald
                            : AppTheme.rose,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Inbound Message
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.background,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('INCOMING:', style: TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
                const SizedBox(height: 3),
                Text(
                  draft.incomingMessage,
                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          // Outbound Generated Reply
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppTheme.surfaceElevated.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('REPLY:', style: TextStyle(fontSize: 10, color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
                const SizedBox(height: 3),
                Text(
                  draft.activeReplyText,
                  style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
          const SizedBox(height: 10),

          // Safety pill
          Row(
            children: [
              Icon(
                draft.safetyCheck.isSafe ? Icons.check_circle_outline : Icons.warning_amber_rounded,
                size: 14,
                color: draft.safetyCheck.isSafe ? AppTheme.emerald : AppTheme.rose,
              ),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  draft.safetyCheck.reason,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Action buttons
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              IconButton(
                icon: const Icon(Icons.copy, size: 16, color: AppTheme.textSecondary),
                tooltip: 'Copy',
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: draft.activeReplyText));
                  _updateStatus(draft, 'copied');
                },
              ),
              IconButton(
                icon: const Icon(Icons.share, size: 16, color: AppTheme.textSecondary),
                tooltip: 'Share',
                onPressed: () {
                  SharePlus.instance.share(ShareParams(text: draft.activeReplyText));
                  _updateStatus(draft, 'shared');
                },
              ),
              if (isPending) ...[
                const SizedBox(width: 4),
                OutlinedButton(
                  onPressed: () => _updateStatus(draft, 'rejected'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.rose,
                    side: const BorderSide(color: AppTheme.roseMuted),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    textStyle: const TextStyle(fontSize: 11),
                  ),
                  child: const Text('Reject'),
                ),
                const SizedBox(width: 6),
                ElevatedButton(
                  onPressed: () => _updateStatus(draft, 'approved'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.emeraldMuted,
                    foregroundColor: AppTheme.emerald,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    textStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                  child: const Text('Approve'),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
