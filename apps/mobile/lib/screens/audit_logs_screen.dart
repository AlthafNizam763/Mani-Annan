import 'package:flutter/material.dart';
import '../models/audit_log.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/state_views.dart';

class AuditLogsScreen extends StatefulWidget {
  final ApiService apiService;

  const AuditLogsScreen({super.key, required this.apiService});

  @override
  State<AuditLogsScreen> createState() => _AuditLogsScreenState();
}

class _AuditLogsScreenState extends State<AuditLogsScreen> {
  List<AuditLog> _logs = [];
  bool _loading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadLogs();
  }

  Future<void> _loadLogs() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final list = await widget.apiService.getAuditLogs();
      if (!mounted) return;
      setState(() => _logs = list);
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Activity & Delivery Logs'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _loadLogs,
          ),
        ],
      ),
      body: _loading && _logs.isEmpty
          ? const LoadingStateView(message: 'Loading immutable audit trail...')
          : _errorMessage != null && _logs.isEmpty
              ? ErrorBannerView(message: _errorMessage!, onRetry: _loadLogs)
              : _logs.isEmpty
                  ? const EmptyStateView(
                      icon: Icons.history,
                      title: 'No Activity Logs Recorded',
                      description: 'AI generations, safety rule checks, draft approvals, and webhook deliveries will appear here.',
                    )
                  : RefreshIndicator(
                      onRefresh: _loadLogs,
                      color: Colors.white,
                      backgroundColor: AppTheme.surfaceElevated,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _logs.length,
                        itemBuilder: (context, idx) {
                          final log = _logs[idx];
                          return _buildLogCard(log);
                        },
                      ),
                    ),
    );
  }

  Widget _buildLogCard(AuditLog log) {
    Color decisionColor = AppTheme.emerald;
    if (log.decision == 'blocked') decisionColor = AppTheme.rose;
    if (log.decision == 'manual_review_forced') decisionColor = AppTheme.amber;

    final dateStr = DateTime.tryParse(log.timestamp)?.toLocal().toString().split('.').first ?? log.timestamp;

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  log.eventType.toUpperCase().replaceAll('_', ' '),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                    fontFamily: 'monospace',
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: decisionColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(4),
                  border: Border.all(color: decisionColor.withValues(alpha: 0.4)),
                ),
                child: Text(
                  log.decision.toUpperCase().replaceAll('_', ' '),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: decisionColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Row(
            children: [
              const Icon(Icons.code, size: 12, color: AppTheme.textMuted),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  log.reasonCode,
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontFamily: 'monospace'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              const Icon(Icons.access_time, size: 12, color: AppTheme.textMuted),
              const SizedBox(width: 4),
              Text(
                dateStr,
                style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
