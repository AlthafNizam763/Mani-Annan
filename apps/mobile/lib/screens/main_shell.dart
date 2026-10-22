import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import 'audit_logs_screen.dart';
import 'chat_import_screen.dart';
import 'contacts_screen.dart';
import 'privacy_screen.dart';
import 'reply_studio_screen.dart';
import 'review_queue_screen.dart';
import 'style_profile_screen.dart';
import 'whatsapp_automation_screen.dart';

class MainShellScreen extends StatefulWidget {
  final ApiService apiService;
  final AuthService authService;

  const MainShellScreen({
    super.key,
    required this.apiService,
    required this.authService,
  });

  @override
  State<MainShellScreen> createState() => _MainShellScreenState();
}

class _MainShellScreenState extends State<MainShellScreen> {
  int _selectedIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      ReplyStudioScreen(apiService: widget.apiService),
      ReviewQueueScreen(apiService: widget.apiService),
      ContactsScreen(apiService: widget.apiService),
      _StyleAndImportContainer(apiService: widget.apiService),
      WhatsAppAutomationScreen(apiService: widget.apiService),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: AppTheme.border, width: 1),
                color: AppTheme.surfaceElevated,
              ),
              child: ClipOval(
                child: Image.asset(
                  'assets/logo.png',
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) =>
                      const Icon(Icons.person, size: 18, color: Colors.white),
                ),
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'Mani-Annan',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
              decoration: BoxDecoration(
                color: AppTheme.surfaceElevated,
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text(
                'MVP',
                style: TextStyle(fontSize: 9, fontFamily: 'monospace', color: AppTheme.textMuted),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.history_outlined, size: 20),
            tooltip: 'Activity Logs',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (ctx) => AuditLogsScreen(apiService: widget.apiService),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.shield_outlined, size: 20),
            tooltip: 'Privacy & Settings',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (ctx) => PrivacyScreen(
                    apiService: widget.apiService,
                    authService: widget.authService,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _selectedIndex,
        children: _screens,
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (idx) => setState(() => _selectedIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.chat_bubble_outline),
            selectedIcon: Icon(Icons.chat_bubble),
            label: 'Studio',
          ),
          NavigationDestination(
            icon: Icon(Icons.checklist_rtl_outlined),
            selectedIcon: Icon(Icons.checklist_rtl),
            label: 'Queue',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Contacts',
          ),
          NavigationDestination(
            icon: Icon(Icons.auto_awesome_outlined),
            selectedIcon: Icon(Icons.auto_awesome),
            label: 'Style',
          ),
          NavigationDestination(
            icon: Icon(Icons.bolt_outlined),
            selectedIcon: Icon(Icons.bolt),
            label: 'Mani Auto',
          ),
        ],
      ),
    );
  }
}

/// Dual-tab container for Style Profile and Chat Import
class _StyleAndImportContainer extends StatefulWidget {
  final ApiService apiService;

  const _StyleAndImportContainer({required this.apiService});

  @override
  State<_StyleAndImportContainer> createState() => _StyleAndImportContainerState();
}

class _StyleAndImportContainerState extends State<_StyleAndImportContainer> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          color: AppTheme.background,
          child: TabBar(
            controller: _tabController,
            indicatorColor: AppTheme.emerald,
            labelColor: AppTheme.emerald,
            unselectedLabelColor: AppTheme.textMuted,
            labelStyle: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
            unselectedLabelStyle: const TextStyle(fontSize: 12),
            tabs: const [
              Tab(icon: Icon(Icons.auto_awesome, size: 16), text: 'Style Profile'),
              Tab(icon: Icon(Icons.upload_file, size: 16), text: 'Chat Import'),
            ],
          ),
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              StyleProfileScreen(apiService: widget.apiService),
              ChatImportScreen(
                apiService: widget.apiService,
                onStyleUpdated: () {
                  // Switch to style profile tab to view new calibration
                  _tabController.animateTo(0);
                },
              ),
            ],
          ),
        ),
      ],
    );
  }
}
