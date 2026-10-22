import 'dart:async';
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/whatsapp.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/state_views.dart';

class WhatsAppAutomationScreen extends StatefulWidget {
  final ApiService apiService;

  const WhatsAppAutomationScreen({super.key, required this.apiService});

  @override
  State<WhatsAppAutomationScreen> createState() => _WhatsAppAutomationScreenState();
}

class _WhatsAppAutomationScreenState extends State<WhatsAppAutomationScreen> {
  WhatsAppCapabilityReport? _report;
  AutomationSettings? _settings;
  WhatsAppConnectionSession? _qrSession;
  bool _loading = false;
  String? _errorMessage;
  String? _statusMessage;
  Timer? _pollTimer;
  Timer? _countdownTimer;

  void _cancelTimers() {
    _pollTimer?.cancel();
    _pollTimer = null;
    _countdownTimer?.cancel();
    _countdownTimer = null;
  }

  @override
  void dispose() {
    _cancelTimers();
    super.dispose();
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final rep = await widget.apiService.getWhatsAppCapabilities();
      final set = await widget.apiService.getAutomationSettings();
      WhatsAppConnectionSession? qr;
      try {
        qr = await widget.apiService.getWhatsAppSessionStatus();
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _report = rep;
        _settings = set;
        _qrSession = qr;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _toggleManiGlobal() async {
    if (_settings == null) return;

    final updated = _settings!.copyWith(
      maniGlobalEnabled: !_settings!.maniGlobalEnabled,
    );

    try {
      final res = await widget.apiService.updateAutomationSettings(updated);
      if (!mounted) return;
      setState(() {
        _settings = res;
        _statusMessage = 'Global Mani Assistant is now ${res.maniGlobalEnabled ? "ON" : "OFF"}.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    }
  }

  Future<void> _triggerEmergencyStop() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: AppTheme.rose),
            SizedBox(width: 8),
            Text('Trigger Emergency Stop', style: TextStyle(color: AppTheme.textPrimary)),
          ],
        ),
        content: const Text(
          'This will instantly halt all automatic sends, disable Mani globally, and freeze all automation queues.',
          style: TextStyle(color: AppTheme.textSecondary, fontSize: 13),
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
            child: const Text('TRIGGER STOP'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await widget.apiService.triggerEmergencyStop();
        final refreshed = await widget.apiService.getAutomationSettings();
        if (!mounted) return;
        setState(() {
          _settings = refreshed;
          _statusMessage = 'EMERGENCY STOP ACTIVATED: All automation killed.';
        });
      } catch (e) {
        if (!mounted) return;
        setState(() => _errorMessage = e.toString());
      }
    }
  }

  Future<void> _disconnectQR() async {
    try {
      await widget.apiService.disconnectWhatsAppSession();
      final refreshed = await widget.apiService.getAutomationSettings();
      if (!mounted) return;
      setState(() {
        _settings = refreshed;
        _qrSession = const WhatsAppConnectionSession(status: 'disconnected');
        _statusMessage = 'WhatsApp session disconnected.';
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    }
  }

  void _showQRConnectionSheet(BuildContext context) {
    WhatsAppConnectionSession? currentSession = _qrSession;
    bool isFetching = currentSession == null || (currentSession.status != 'qr_ready' && currentSession.status != 'connected');
    int? secondsRemaining;
    bool hasInitiated = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (ctx) {
        void closeSheet() {
          _cancelTimers();
          if (ctx.mounted) {
            Navigator.pop(ctx);
          }
        }

        return StatefulBuilder(
          builder: (sheetContext, setSheetState) {
            void startCountdown(String? expiresAt) {
              _countdownTimer?.cancel();
              if (expiresAt != null) {
                final expiry = DateTime.tryParse(expiresAt);
                if (expiry != null) {
                  final diff = expiry.difference(DateTime.now()).inSeconds;
                  secondsRemaining = diff > 0 ? diff : 0;
                  _countdownTimer = Timer.periodic(const Duration(seconds: 1), (t) {
                    if (!sheetContext.mounted) {
                      t.cancel();
                      return;
                    }
                    if (secondsRemaining != null && secondsRemaining! > 0) {
                      setSheetState(() => secondsRemaining = secondsRemaining! - 1);
                    } else {
                      t.cancel();
                    }
                  });
                }
              }
            }

            Future<void> initiate() async {
              if (!sheetContext.mounted) return;
              setSheetState(() => isFetching = true);
              try {
                final session = await widget.apiService.connectWhatsAppSession();
                if (!sheetContext.mounted) return;
                setSheetState(() {
                  currentSession = session;
                  isFetching = false;
                });
                setState(() => _qrSession = session);
                if (session.status == 'qr_ready') {
                  startCountdown(session.expiresAt);
                }
              } catch (e) {
                if (!sheetContext.mounted) return;
                final isUnconfigured = (e is ApiException && (e.error == 'ProviderNotConfigured' || e.statusCode == 400)) ||
                    e.toString().contains('ProviderNotConfigured') ||
                    e.toString().contains('not configured');
                setSheetState(() {
                  currentSession = WhatsAppConnectionSession(
                    status: isUnconfigured ? 'not_configured' : 'error',
                    message: e is ApiException ? e.message : e.toString(),
                  );
                  isFetching = false;
                });
              }
            }

            Future<void> refresh() async {
              if (!sheetContext.mounted) return;
              setSheetState(() => isFetching = true);
              try {
                final session = await widget.apiService.refreshWhatsAppSession();
                if (!sheetContext.mounted) return;
                setSheetState(() {
                  currentSession = session;
                  isFetching = false;
                });
                setState(() => _qrSession = session);
                if (session.status == 'qr_ready') {
                  startCountdown(session.expiresAt);
                }
              } catch (e) {
                if (!sheetContext.mounted) return;
                final isUnconfigured = (e is ApiException && (e.error == 'ProviderNotConfigured' || e.statusCode == 400)) ||
                    e.toString().contains('ProviderNotConfigured') ||
                    e.toString().contains('not configured');
                setSheetState(() {
                  currentSession = WhatsAppConnectionSession(
                    status: isUnconfigured ? 'not_configured' : 'error',
                    message: e is ApiException ? e.message : e.toString(),
                  );
                  isFetching = false;
                });
              }
            }

            if (!hasInitiated && (currentSession == null || (currentSession?.status != 'qr_ready' && currentSession?.status != 'connected'))) {
              hasInitiated = true;
              WidgetsBinding.instance.addPostFrameCallback((_) {
                initiate();
              });
            }

            _pollTimer ??= Timer.periodic(const Duration(seconds: 3), (_) async {
              if (!sheetContext.mounted) {
                _pollTimer?.cancel();
                return;
              }
              if (currentSession?.status == 'qr_ready' || currentSession?.status == 'connecting') {
                try {
                  final live = await widget.apiService.getWhatsAppSessionStatus();
                  if (!sheetContext.mounted) return;
                  if (live.status != currentSession?.status) {
                    setSheetState(() => currentSession = live);
                    setState(() => _qrSession = live);
                    if (live.status == 'connected') {
                      final refreshedSettings = await widget.apiService.getAutomationSettings();
                      if (mounted) setState(() => _settings = refreshedSettings);
                    }
                  }
                } catch (_) {}
              }
            });

            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(sheetContext).viewInsets.bottom + 24,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.qr_code_2, size: 22, color: AppTheme.emerald),
                        const SizedBox(width: 8),
                        const Text(
                          'Connect WhatsApp via QR',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.close, size: 20),
                          onPressed: closeSheet,
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    if (isFetching) ...[
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 40),
                        child: Column(
                          children: [
                            CircularProgressIndicator(color: AppTheme.emerald),
                            SizedBox(height: 16),
                            Text('Requesting secure session from WhatsApp provider...', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                          ],
                        ),
                      ),
                    ] else if (currentSession?.status == 'not_configured') ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppTheme.amberMuted.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.amber),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Row(
                              children: [
                                Icon(Icons.warning_amber_rounded, size: 18, color: AppTheme.amber),
                                SizedBox(width: 6),
                                Text('WhatsApp Integration Not Configured', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.amber)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              currentSession?.message ?? 'WhatsApp Linked Devices QR provider is not configured on the backend. Personal WhatsApp account QR automation is not supported without an approved provider integration.',
                              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.4),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.background,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: const Text(
                          'Why personal QR automation is restricted: Meta provides no official cloud API for personal accounts paired via Linked Devices. Unofficial scraping bots violate WhatsApp ToS and trigger permanent bans. Mani strictly refuses unsupported scraping.',
                          style: TextStyle(fontSize: 11, color: AppTheme.textMuted, height: 1.4),
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: closeSheet,
                        child: const Text('Close'),
                      ),
                    ] else if (currentSession?.status == 'error') ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppTheme.roseMuted.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.rose),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Connection Error', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.rose)),
                            const SizedBox(height: 6),
                            Text(currentSession?.message ?? 'Failed to connect to WhatsApp provider.', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: closeSheet,
                              child: const Text('Cancel'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: initiate,
                              child: const Text('Retry'),
                            ),
                          ),
                        ],
                      ),
                    ] else if (currentSession?.status == 'qr_ready') ...[
                      // Instructions
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppTheme.background,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.border),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('How to Link WhatsApp:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                            const SizedBox(height: 6),
                            ...?currentSession?.instructions.map((inst) => Padding(
                              padding: const EdgeInsets.only(bottom: 3),
                              child: Text('• $inst', style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                            )),
                          ],
                        ),
                      ),
                      const SizedBox(height: 14),

                      // QR Code Container
                      Center(
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: QrImageView(
                            data: currentSession!.qrPayload ?? '',
                            version: QrVersions.auto,
                            size: 200.0,
                            backgroundColor: Colors.white,
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Expiry timer
                      if (secondsRemaining != null)
                        Center(
                          child: Text(
                            secondsRemaining! > 0
                                ? 'QR expires in ${secondsRemaining}s'
                                : 'QR code expired. Click Refresh QR.',
                            style: TextStyle(
                              fontSize: 12,
                              fontFamily: 'monospace',
                              color: secondsRemaining! > 0 ? AppTheme.textMuted : AppTheme.amber,
                            ),
                          ),
                        ),
                      const SizedBox(height: 8),

                      // Same Phone Notice
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: AppTheme.background,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppTheme.borderSubtle),
                        ),
                        child: const Text(
                          'Same-Phone Notice: If you are viewing Mani on the same phone that runs WhatsApp, you will need a second device or screen to scan this QR code, or use the OS Share / Clipboard mode.',
                          style: TextStyle(fontSize: 11, color: AppTheme.textMuted, height: 1.3),
                        ),
                      ),
                      const SizedBox(height: 16),

                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton.icon(
                              icon: const Icon(Icons.refresh, size: 16),
                              label: const Text('Refresh QR'),
                              onPressed: refresh,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: OutlinedButton(
                              onPressed: closeSheet,
                              child: const Text('Cancel'),
                            ),
                          ),
                        ],
                      ),
                    ] else if (currentSession?.status == 'expired') ...[
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppTheme.amberMuted.withValues(alpha: 0.3),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppTheme.amber),
                        ),
                        child: const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('QR Code Expired', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.amber)),
                            SizedBox(height: 6),
                            Text('The linking QR code expired to protect your session security. Please request a fresh QR code from the provider.', style: TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: closeSheet,
                              child: const Text('Close'),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: ElevatedButton.icon(
                              icon: const Icon(Icons.refresh, size: 16),
                              label: const Text('Refresh QR'),
                              onPressed: refresh,
                            ),
                          ),
                        ],
                      ),
                    ] else if (currentSession?.status == 'connected') ...[
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: 20),
                        child: Column(
                          children: [
                            const Icon(Icons.check_circle_outline, size: 48, color: AppTheme.emerald),
                            const SizedBox(height: 12),
                            const Text('WhatsApp Connected Successfully!', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                            const SizedBox(height: 6),
                            Text(
                              'Linked Phone: ${currentSession?.connectedPhone ?? "Personal Account"}',
                              style: const TextStyle(fontSize: 12, fontFamily: 'monospace', color: AppTheme.emerald),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: closeSheet,
                        child: const Text('Done'),
                      ),
                    ],
                  ],
                ),
              ),
            );
          },
        );
      },
    ).whenComplete(_cancelTimers);
  }

  Widget _buildQRConnectionCard() {
    final isConnected = _qrSession?.status == 'connected';

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppTheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const Icon(Icons.qr_code_2, size: 20, color: AppTheme.emerald),
              const SizedBox(width: 8),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Personal WhatsApp Linked Devices',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Pair personal account using Linked Devices QR code',
                      style: TextStyle(fontSize: 11, color: AppTheme.textMuted),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isConnected
                      ? AppTheme.emeraldMuted.withValues(alpha: 0.4)
                      : AppTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(5),
                  border: Border.all(
                    color: isConnected ? AppTheme.emerald : AppTheme.borderSubtle,
                  ),
                ),
                child: Text(
                  isConnected ? 'CONNECTED' : (_qrSession?.status.toUpperCase() ?? 'DISCONNECTED'),
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: isConnected ? AppTheme.emerald : AppTheme.textSecondary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (isConnected) ...[
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: AppTheme.background,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppTheme.border),
              ),
              child: Row(
                children: [
                  const Text('Linked Phone: ', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                  Text(
                    _qrSession?.connectedPhone ?? 'Personal WhatsApp',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.emerald, fontFamily: 'monospace'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => _showQRConnectionSheet(context),
                    child: const Text('Reconnect', style: TextStyle(fontSize: 12)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton(
                    onPressed: _disconnectQR,
                    style: OutlinedButton.styleFrom(foregroundColor: AppTheme.rose),
                    child: const Text('Disconnect', style: TextStyle(fontSize: 12)),
                  ),
                ),
              ],
            ),
          ] else ...[
            ElevatedButton.icon(
              icon: const Icon(Icons.qr_code_scanner, size: 16),
              label: const Text('Connect WhatsApp'),
              onPressed: () => _showQRConnectionSheet(context),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('WhatsApp & Automation'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _loading && _settings == null
          ? const LoadingStateView(message: 'Loading automation status...')
          : RefreshIndicator(
              onRefresh: _loadData,
              color: Colors.white,
              backgroundColor: AppTheme.surfaceElevated,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    if (_errorMessage != null)
                      ErrorBannerView(message: _errorMessage!, onRetry: _loadData),

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
                            const Icon(Icons.info_outline, size: 16, color: AppTheme.emerald),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(_statusMessage!, style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary)),
                            ),
                            GestureDetector(
                              onTap: () => setState(() => _statusMessage = null),
                              child: const Icon(Icons.close, size: 14, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      ),
                    ],

                    // Account Type Badge Card
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppTheme.surface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.verified_user_outlined, size: 18, color: AppTheme.emerald),
                          const SizedBox(width: 10),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Configured Account Type', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                                SizedBox(height: 2),
                                Text(
                                  'Normal Personal WhatsApp Account',
                                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.surfaceElevated,
                              borderRadius: BorderRadius.circular(5),
                              border: Border.all(color: AppTheme.borderSubtle),
                            ),
                            child: const Text('Personal', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Personal WhatsApp Linked Devices QR Connection Card
                    _buildQRConnectionCard(),
                    const SizedBox(height: 16),

                    // Section 1: Backend Persisted Automation Controls
                    _sectionTitle('Automation Controls (Backend Persisted)', Icons.tune),
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
                          // Global Mani ON/OFF
                          Row(
                            children: [
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Global Mani Assistant', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                                    SizedBox(height: 2),
                                    Text('Master switch for backend AI processing', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                                  ],
                                ),
                              ),
                              ElevatedButton(
                                onPressed: _toggleManiGlobal,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: _settings?.maniGlobalEnabled == true
                                      ? AppTheme.emerald
                                      : AppTheme.surfaceElevated,
                                  foregroundColor: _settings?.maniGlobalEnabled == true
                                      ? Colors.black
                                      : AppTheme.textSecondary,
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                ),
                                child: Text(
                                  _settings?.maniGlobalEnabled == true ? 'MANI ON' : 'MANI OFF',
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                          const Divider(height: 24),

                          // Emergency Stop
                          Row(
                            children: [
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Emergency Stop', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                                    SizedBox(height: 2),
                                    Text('Instantly freeze all automated actions', style: TextStyle(fontSize: 11, color: AppTheme.textMuted)),
                                  ],
                                ),
                              ),
                              ElevatedButton(
                                onPressed: _triggerEmergencyStop,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppTheme.roseMuted,
                                  foregroundColor: AppTheme.rose,
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                ),
                                child: const Text('TRIGGER STOP', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 2: Real Connection Health
                    _sectionTitle('Real Connection Health & Event Activity', Icons.monitor_heart_outlined),
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
                          _healthRow(
                            'Last Webhook Received',
                            _settings?.lastWebhookTimestamp ?? 'None (Waiting for events)',
                          ),
                          const SizedBox(height: 8),
                          _healthRow(
                            'Last Event Processed',
                            _settings?.lastEventReceived ?? 'None',
                          ),
                          const SizedBox(height: 8),
                          _healthRow(
                            'Last Successful Send',
                            _settings?.lastSuccessfulSend ?? 'None',
                          ),
                          const SizedBox(height: 8),
                          _healthRow(
                            'Last Delivery Failure',
                            _settings?.lastDeliveryFailure ?? 'None (Healthy)',
                            isError: _settings?.lastDeliveryFailure != null,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Section 3: Connection Capabilities Matrix
                    _sectionTitle('Connection Status & Supported Providers', Icons.hub_outlined),
                    const SizedBox(height: 8),
                    if (_report != null) ...[
                      ..._report!.supportedProviders.map((prov) => _buildProviderCard(prov)),
                    ],
                    const SizedBox(height: 16),

                    // Section 4: Educational Ban Protection & Linked Devices Audit Notice
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: AppTheme.surfaceElevated.withValues(alpha: 0.4),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.borderSubtle),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.shield_outlined, size: 16, color: AppTheme.emerald),
                              SizedBox(width: 8),
                              Text(
                                'Linked Devices & Personal Account Capability Audit',
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Why Linked Devices QR automation is marked UNAVAILABLE:',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Meta’s official Linked Devices architecture is designed solely for interactive personal clients (WhatsApp Web/Desktop) using proprietary end-to-end Signal/Noise session synchronization. Meta does not expose an official API or webhook interface for third-party automated message ingestion or dispatching on personal accounts.',
                            style: TextStyle(fontSize: 11, color: AppTheme.textMuted, height: 1.35),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Ban & Integrity Protection:',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Tools claiming QR-based automation utilize reverse-engineered websocket parsers or headless browser automation (e.g. Baileys, whatsapp-web.js). These actively violate Meta’s Terms of Service and trigger automated anti-bot detection leading to irreversible personal number bans. Mani strictly refuses unsupported scraping.',
                            style: TextStyle(fontSize: 11, color: AppTheme.textMuted, height: 1.35),
                          ),
                          const SizedBox(height: 10),
                          const Divider(),
                          const SizedBox(height: 8),
                          const Text('Legitimate Supported Paths:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                          const SizedBox(height: 4),
                          _bulletItem('Official Cloud API: 24/7 autonomous messaging with dashboard closed. Requires dedicated number on Meta Business Platform.'),
                          _bulletItem('Android Notification Companion: Local Android background service that replies to personal notifications via Android RemoteInput while physical phone is on.'),
                          _bulletItem('Human-in-the-Loop Studio: Copy/Share sheet directly to personal WhatsApp with 100% safety and zero ban risk.'),
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

  Widget _healthRow(String label, String value, {bool isError = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
        Text(
          value,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: isError ? AppTheme.rose : AppTheme.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildProviderCard(SupportedProvider prov) {
    Color statusColor;
    String statusLabel = prov.status.toUpperCase().replaceAll('_', ' ');

    switch (prov.status) {
      case 'connected_active':
        statusColor = AppTheme.emerald;
        break;
      case 'ready_for_onboarding':
        statusColor = AppTheme.blue;
        break;
      case 'blocked_awaiting_meta_credentials':
        statusColor = AppTheme.amber;
        break;
      case 'unavailable_unsupported':
        statusColor = AppTheme.rose;
        break;
      default:
        statusColor = AppTheme.textMuted;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
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
              Expanded(
                child: Text(
                  prov.displayName,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                decoration: BoxDecoration(
                  color: statusColor.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(5),
                  border: Border.all(color: statusColor.withValues(alpha: 0.4)),
                ),
                child: Text(
                  statusLabel,
                  style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(prov.description, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary, height: 1.35)),
          if (prov.riskAssessment != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.surfaceElevated,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                prov.riskAssessment!,
                style: const TextStyle(fontSize: 10, color: AppTheme.amber, height: 1.3),
              ),
            ),
          ],
          const SizedBox(height: 8),
          Row(
            children: [
              Text(
                'Dashboard Closed: ${prov.worksWhenDashboardClosed ? "YES" : "NO"}',
                style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
              ),
              const SizedBox(width: 12),
              Text(
                'Dedicated Number: ${prov.requiresDedicatedNumber ? "YES" : "NO"}',
                style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _bulletItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(color: AppTheme.emerald, fontSize: 11)),
          Expanded(
            child: Text(text, style: const TextStyle(fontSize: 11, color: AppTheme.textMuted, height: 1.3)),
          ),
        ],
      ),
    );
  }
}
