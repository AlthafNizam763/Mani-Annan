import 'package:flutter/material.dart';
import '../models/contact.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';
import '../widgets/state_views.dart';

class ContactsScreen extends StatefulWidget {
  final ApiService apiService;

  const ContactsScreen({super.key, required this.apiService});

  @override
  State<ContactsScreen> createState() => _ContactsScreenState();
}

class _ContactsScreenState extends State<ContactsScreen> {
  List<Contact> _contacts = [];
  bool _loading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadContacts();
  }

  Future<void> _loadContacts() async {
    setState(() {
      _loading = true;
      _errorMessage = null;
    });

    try {
      final list = await widget.apiService.getContacts();
      if (!mounted) return;
      setState(() => _contacts = list);
    } catch (e) {
      if (!mounted) return;
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _togglePause(Contact contact) async {
    try {
      final updated = await widget.apiService.updateContact(
        contact.id,
        {'isPaused': !contact.isPaused},
      );
      if (!mounted) return;
      setState(() {
        final idx = _contacts.indexWhere((c) => c.id == contact.id);
        if (idx != -1) _contacts[idx] = updated;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('${contact.name} is now ${updated.isPaused ? "Paused" : "Active"}')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed: ${e.toString()}')),
      );
    }
  }

  Future<void> _deleteContact(Contact contact) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.surface,
        title: const Text('Delete Contact', style: TextStyle(color: AppTheme.textPrimary)),
        content: Text(
          'Are you sure you want to delete ${contact.name}? All per-contact safety rules and tone configurations for this contact will be removed.',
          style: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel', style: TextStyle(color: AppTheme.textMuted)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.roseMuted,
              foregroundColor: AppTheme.rose,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await widget.apiService.deleteContact(contact.id);
        if (!mounted) return;
        setState(() => _contacts.removeWhere((c) => c.id == contact.id));
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Contact ${contact.name} deleted')),
        );
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Delete failed: ${e.toString()}')),
        );
      }
    }
  }

  void _showAddContactSheet() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    String relationship = 'friend';
    String tone = 'casual';
    bool quietHoursEnabled = false;
    String qStart = '22:00';
    String qEnd = '08:00';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Add New Contact Profile',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.close, size: 20),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Name
                    const Text('Contact Name *', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: nameCtrl,
                      style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                      decoration: const InputDecoration(hintText: 'e.g. David Tan'),
                    ),
                    const SizedBox(height: 14),

                    // Phone Number (Optional)
                    const Text('Phone Number (Optional)', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                      decoration: const InputDecoration(hintText: '+60123456789'),
                    ),
                    const SizedBox(height: 14),

                    // Relationship
                    const Text('Relationship Category', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppTheme.background,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: relationship,
                          isExpanded: true,
                          dropdownColor: AppTheme.surfaceElevated,
                          items: const [
                            DropdownMenuItem(value: 'romantic_partner', child: Text('Romantic Partner')),
                            DropdownMenuItem(value: 'boss_or_manager', child: Text('Boss or Manager')),
                            DropdownMenuItem(value: 'friend', child: Text('Friend')),
                            DropdownMenuItem(value: 'family_member', child: Text('Family Member')),
                            DropdownMenuItem(value: 'custom', child: Text('Custom')),
                          ],
                          onChanged: (val) {
                            if (val != null) setSheetState(() => relationship = val);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Tone
                    const Text('Preferred Tone', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppTheme.background,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: tone,
                          isExpanded: true,
                          dropdownColor: AppTheme.surfaceElevated,
                          items: const [
                            DropdownMenuItem(value: 'casual', child: Text('Casual')),
                            DropdownMenuItem(value: 'professional', child: Text('Professional')),
                            DropdownMenuItem(value: 'warm_and_affectionate', child: Text('Warm & Affectionate')),
                            DropdownMenuItem(value: 'respectful', child: Text('Respectful')),
                            DropdownMenuItem(value: 'humorous_playful', child: Text('Humorous & Playful')),
                            DropdownMenuItem(value: 'neutral_direct', child: Text('Neutral & Direct')),
                          ],
                          onChanged: (val) {
                            if (val != null) setSheetState(() => tone = val);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Quiet Hours Switch
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Enable Quiet Hours for this Contact', style: TextStyle(fontSize: 12, color: AppTheme.textPrimary)),
                      subtitle: Text(
                        quietHoursEnabled ? '$qStart to $qEnd' : 'No quiet hours restriction',
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                      value: quietHoursEnabled,
                      activeThumbColor: AppTheme.emerald,
                      onChanged: (val) => setSheetState(() => quietHoursEnabled = val),
                    ),
                    const SizedBox(height: 16),

                    // Submit
                    ElevatedButton(
                      onPressed: () async {
                        final name = nameCtrl.text.trim();
                        if (name.isEmpty) return;

                        final scaffoldMessenger = ScaffoldMessenger.of(context);
                        final navigator = Navigator.of(ctx);

                        try {
                          final newContact = await widget.apiService.createContact({
                            'name': name,
                            if (phoneCtrl.text.trim().isNotEmpty)
                              'phoneNumber': phoneCtrl.text.trim(),
                            'relationship': relationship,
                            'preferredTone': tone,
                            'autoSendEnabled': false,
                            'sensitiveTopicsRequireReview': true,
                            'isPaused': false,
                            'quietHours': {
                              'enabled': quietHoursEnabled,
                              'start': qStart,
                              'end': qEnd,
                              'timezone': 'UTC',
                            },
                          });
                          if (!mounted) return;
                          setState(() => _contacts.insert(0, newContact));
                          navigator.pop();
                          scaffoldMessenger.showSnackBar(
                            SnackBar(content: Text('Contact ${newContact.name} created')),
                          );
                        } catch (e) {
                          scaffoldMessenger.showSnackBar(
                            SnackBar(content: Text('Error: ${e.toString()}')),
                          );
                        }
                      },
                      child: const Text('Create Contact Profile'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _showEditContactSheet(Contact contact) {
    final nameCtrl = TextEditingController(text: contact.name);
    final phoneCtrl = TextEditingController(text: contact.phoneNumber ?? '');
    String relationship = contact.relationship;
    String tone = contact.preferredTone;
    bool quietHoursEnabled = contact.quietHours.enabled;
    String qStart = contact.quietHours.start;
    String qEnd = contact.quietHours.end;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppTheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 20,
                right: 20,
                top: 20,
                bottom: MediaQuery.of(context).viewInsets.bottom + 20,
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      children: [
                        const Text(
                          'Edit Contact Policy',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                        ),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.close, size: 20),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Name
                    const Text('Contact Name', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: nameCtrl,
                      style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                      decoration: const InputDecoration(fillColor: AppTheme.background),
                    ),
                    const SizedBox(height: 14),

                    // Phone
                    const Text('WhatsApp Phone Number (Optional)', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    TextField(
                      controller: phoneCtrl,
                      keyboardType: TextInputType.phone,
                      style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
                      decoration: const InputDecoration(fillColor: AppTheme.background),
                    ),
                    const SizedBox(height: 14),

                    // Relationship
                    const Text('Relationship Category', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppTheme.background,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: relationship,
                          isExpanded: true,
                          dropdownColor: AppTheme.surfaceElevated,
                          items: const [
                            DropdownMenuItem(value: 'romantic_partner', child: Text('Romantic Partner')),
                            DropdownMenuItem(value: 'boss_or_manager', child: Text('Boss or Manager')),
                            DropdownMenuItem(value: 'friend', child: Text('Friend')),
                            DropdownMenuItem(value: 'family_member', child: Text('Family Member')),
                            DropdownMenuItem(value: 'custom', child: Text('Custom')),
                          ],
                          onChanged: (val) {
                            if (val != null) setSheetState(() => relationship = val);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Tone
                    const Text('Preferred Tone', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: AppTheme.background,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: AppTheme.border),
                      ),
                      child: DropdownButtonHideUnderline(
                        child: DropdownButton<String>(
                          value: tone,
                          isExpanded: true,
                          dropdownColor: AppTheme.surfaceElevated,
                          items: const [
                            DropdownMenuItem(value: 'casual', child: Text('Casual')),
                            DropdownMenuItem(value: 'professional', child: Text('Professional')),
                            DropdownMenuItem(value: 'warm_and_affectionate', child: Text('Warm & Affectionate')),
                            DropdownMenuItem(value: 'respectful', child: Text('Respectful')),
                            DropdownMenuItem(value: 'humorous_playful', child: Text('Humorous & Playful')),
                            DropdownMenuItem(value: 'neutral_direct', child: Text('Neutral & Direct')),
                          ],
                          onChanged: (val) {
                            if (val != null) setSheetState(() => tone = val);
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Quiet Hours Switch
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Enable Quiet Hours for this Contact', style: TextStyle(fontSize: 12, color: AppTheme.textPrimary)),
                      subtitle: Text(
                        quietHoursEnabled ? '$qStart to $qEnd' : 'No quiet hours restriction',
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                      value: quietHoursEnabled,
                      activeThumbColor: AppTheme.emerald,
                      onChanged: (val) => setSheetState(() => quietHoursEnabled = val),
                    ),
                    const SizedBox(height: 16),

                    // Submit
                    ElevatedButton(
                      onPressed: () async {
                        final name = nameCtrl.text.trim();
                        if (name.isEmpty) return;

                        final scaffoldMessenger = ScaffoldMessenger.of(context);
                        final navigator = Navigator.of(ctx);

                        try {
                          final updatedContact = await widget.apiService.updateContact(
                            contact.id,
                            {
                              'name': name,
                              'phoneNumber': phoneCtrl.text.trim().isNotEmpty ? phoneCtrl.text.trim() : null,
                              'relationship': relationship,
                              'preferredTone': tone,
                              'quietHours': {
                                'enabled': quietHoursEnabled,
                                'start': qStart,
                                'end': qEnd,
                                'timezone': 'UTC',
                              },
                            },
                          );
                          if (!mounted) return;
                          setState(() {
                            final idx = _contacts.indexWhere((c) => c.id == contact.id);
                            if (idx != -1) _contacts[idx] = updatedContact;
                          });
                          navigator.pop();
                          scaffoldMessenger.showSnackBar(
                            SnackBar(content: Text('Contact ${updatedContact.name} updated')),
                          );
                        } catch (e) {
                          scaffoldMessenger.showSnackBar(
                            SnackBar(content: Text('Error: ${e.toString()}')),
                          );
                        }
                      },
                      child: const Text('Save Contact Policy'),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.background,
      appBar: AppBar(
        title: const Text('Contacts & Policies'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add, size: 22),
            tooltip: 'Add Contact',
            onPressed: _showAddContactSheet,
          ),
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            tooltip: 'Refresh',
            onPressed: _loadContacts,
          ),
        ],
      ),
      body: _loading && _contacts.isEmpty
          ? const LoadingStateView(message: 'Loading contacts...')
          : _errorMessage != null && _contacts.isEmpty
              ? ErrorBannerView(message: _errorMessage!, onRetry: _loadContacts)
              : _contacts.isEmpty
                  ? EmptyStateView(
                      icon: Icons.people_outline,
                      title: 'No Contacts Configured',
                      description: 'Add contacts with relationship parameters and safety tone profiles to start generating personalized replies.',
                      actionLabel: 'Add Contact',
                      onAction: _showAddContactSheet,
                    )
                  : RefreshIndicator(
                      onRefresh: _loadContacts,
                      color: Colors.white,
                      backgroundColor: AppTheme.surfaceElevated,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _contacts.length,
                        itemBuilder: (context, idx) {
                          final c = _contacts[idx];
                          return _buildContactCard(c);
                        },
                      ),
                    ),
    );
  }

  Widget _buildContactCard(Contact contact) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      contact.name,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    if (contact.phoneNumber != null) ...[
                      const SizedBox(height: 2),
                      Text(
                        contact.phoneNumber!,
                        style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                      ),
                    ],
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: contact.isPaused
                      ? AppTheme.amberMuted.withValues(alpha: 0.4)
                      : AppTheme.emeraldMuted.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(5),
                ),
                child: Text(
                  contact.isPaused ? 'PAUSED' : 'ACTIVE',
                  style: TextStyle(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: contact.isPaused ? AppTheme.amber : AppTheme.emerald,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),

          // Chips: Relationship & Tone
          Wrap(
            spacing: 6,
            runSpacing: 4,
            children: [
              _infoBadge(contact.relationshipFormatted, Icons.people_alt_outlined),
              _infoBadge('Tone: ${contact.toneFormatted}', Icons.tune),
              if (contact.quietHours.enabled)
                _infoBadge(
                  'Quiet: ${contact.quietHours.start}-${contact.quietHours.end}',
                  Icons.bedtime_outlined,
                ),
              _infoBadge('Auto-Send: Disabled (Safe)', Icons.lock_outline),
            ],
          ),
          const SizedBox(height: 12),

          // Actions: Pause / Resume & Delete
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              OutlinedButton(
                onPressed: () => _togglePause(contact),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  textStyle: const TextStyle(fontSize: 11),
                ),
                child: Text(contact.isPaused ? 'Resume' : 'Pause'),
              ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.edit_outlined, size: 18, color: AppTheme.textSecondary),
                tooltip: 'Edit Contact Policy',
                onPressed: () => _showEditContactSheet(contact),
              ),
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18, color: AppTheme.rose),
                tooltip: 'Delete Contact',
                onPressed: () => _deleteContact(contact),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _infoBadge(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: AppTheme.surfaceElevated,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 11, color: AppTheme.textMuted),
          const SizedBox(width: 4),
          Text(label, style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
        ],
      ),
    );
  }
}
