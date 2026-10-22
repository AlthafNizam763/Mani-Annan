import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/contact.dart';
import '../models/draft.dart';
import '../models/user_profile.dart';
import '../models/whatsapp.dart';
import '../models/audit_log.dart';

class ApiException implements Exception {
  final int statusCode;
  final String message;
  final String? error;

  ApiException(this.statusCode, this.message, {this.error});

  @override
  String toString() => message;
}

class ApiService {
  String baseUrl;
  String? authToken;
  final http.Client client;

  ApiService({
    String? baseUrl,
    this.authToken,
    http.Client? client,
  })  : baseUrl = baseUrl ?? 'http://10.0.2.2:4001/api/v1',
        client = client ?? http.Client();

  Map<String, String> _headers() {
    final map = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (authToken != null && authToken!.isNotEmpty) {
      map['Authorization'] = 'Bearer $authToken';
    }
    return map;
  }

  dynamic _handleResponse(http.Response res) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      if (res.body.isEmpty) return null;
      return jsonDecode(res.body);
    }

    String errorMsg = 'HTTP ${res.statusCode}';
    String? errType;
    try {
      final data = jsonDecode(res.body);
      if (data is Map<String, dynamic>) {
        errorMsg = data['message'] ?? data['error'] ?? errorMsg;
        errType = data['error'] as String?;
      }
    } catch (_) {}
    throw ApiException(res.statusCode, errorMsg, error: errType);
  }

  // ==========================================
  // Profile & Style
  // ==========================================
  Future<UserProfile> getMe() async {
    final res = await client.get(
      Uri.parse('$baseUrl/me'),
      headers: _headers(),
    );
    final data = _handleResponse(res);
    return UserProfile.fromJson(data);
  }

  Future<void> updateStyle(Map<String, dynamic> styleData) async {
    final res = await client.put(
      Uri.parse('$baseUrl/me/style'),
      headers: _headers(),
      body: jsonEncode(styleData),
    );
    _handleResponse(res);
  }

  // ==========================================
  // Contacts
  // ==========================================
  Future<List<Contact>> getContacts() async {
    final res = await client.get(
      Uri.parse('$baseUrl/contacts'),
      headers: _headers(),
    );
    final list = _handleResponse(res) as List<dynamic>;
    return list.map((e) => Contact.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Contact> createContact(Map<String, dynamic> contactData) async {
    final res = await client.post(
      Uri.parse('$baseUrl/contacts'),
      headers: _headers(),
      body: jsonEncode(contactData),
    );
    final data = _handleResponse(res);
    return Contact.fromJson(data);
  }

  Future<Contact> updateContact(String contactId, Map<String, dynamic> updates) async {
    final res = await client.patch(
      Uri.parse('$baseUrl/contacts/$contactId'),
      headers: _headers(),
      body: jsonEncode(updates),
    );
    final data = _handleResponse(res);
    return Contact.fromJson(data);
  }

  Future<void> deleteContact(String contactId) async {
    final res = await client.delete(
      Uri.parse('$baseUrl/contacts/$contactId'),
      headers: _headers(),
    );
    _handleResponse(res);
  }

  // ==========================================
  // Reply Studio & Drafts
  // ==========================================
  Future<ReplyDraft> generateReply({
    required String contactId,
    required String incomingMessage,
    String? optionalContext,
  }) async {
    final res = await client.post(
      Uri.parse('$baseUrl/replies/generate'),
      headers: _headers(),
      body: jsonEncode({
        'contactId': contactId,
        'incomingMessage': incomingMessage,
        if (optionalContext != null && optionalContext.isNotEmpty)
          'optionalContext': optionalContext,
      }),
    );
    final data = _handleResponse(res);
    return ReplyDraft.fromJson(data);
  }

  Future<List<ReplyDraft>> getDrafts() async {
    final res = await client.get(
      Uri.parse('$baseUrl/drafts'),
      headers: _headers(),
    );
    final list = _handleResponse(res) as List<dynamic>;
    return list.map((e) => ReplyDraft.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<ReplyDraft> updateDraftStatus({
    required String draftId,
    required String reviewStatus,
    String? editedReply,
  }) async {
    final res = await client.patch(
      Uri.parse('$baseUrl/drafts/$draftId'),
      headers: _headers(),
      body: jsonEncode({
        'reviewStatus': reviewStatus,
        'editedReply': ?editedReply,
      }),
    );
    final data = _handleResponse(res);
    return ReplyDraft.fromJson(data);
  }

  Future<void> submitDraftFeedback({
    required String draftId,
    required String rating,
    String? ownerCorrection,
    String? notes,
  }) async {
    final res = await client.post(
      Uri.parse('$baseUrl/drafts/$draftId/feedback'),
      headers: _headers(),
      body: jsonEncode({
        'draftId': draftId,
        'rating': rating,
        if (ownerCorrection != null && ownerCorrection.isNotEmpty)
          'ownerCorrection': ownerCorrection,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      }),
    );
    _handleResponse(res);
  }

  // ==========================================
  // Chat Import & Calibration
  // ==========================================
  Future<Map<String, dynamic>> importChat({
    required String rawText,
    required String ownerIdentifier,
    String? contactName,
  }) async {
    final res = await client.post(
      Uri.parse('$baseUrl/imports'),
      headers: _headers(),
      body: jsonEncode({
        'rawText': rawText,
        'ownerIdentifier': ownerIdentifier,
        'contactName': ?contactName,
        'consentConfirmed': true,
      }),
    );
    return _handleResponse(res) as Map<String, dynamic>;
  }

  Future<List<dynamic>> getImports() async {
    final res = await client.get(
      Uri.parse('$baseUrl/imports'),
      headers: _headers(),
    );
    return _handleResponse(res) as List<dynamic>;
  }

  Future<void> deleteImport(String importId) async {
    final res = await client.delete(
      Uri.parse('$baseUrl/imports/$importId'),
      headers: _headers(),
    );
    _handleResponse(res);
  }

  // ==========================================
  // WhatsApp & Automation
  // ==========================================
  Future<WhatsAppCapabilityReport> getWhatsAppCapabilities() async {
    final res = await client.get(
      Uri.parse('$baseUrl/integrations/whatsapp/capabilities'),
      headers: _headers(),
    );
    final data = _handleResponse(res);
    return WhatsAppCapabilityReport.fromJson(data);
  }

  Future<AutomationSettings> getAutomationSettings() async {
    final res = await client.get(
      Uri.parse('$baseUrl/integrations/whatsapp/settings'),
      headers: _headers(),
    );
    final data = _handleResponse(res);
    return AutomationSettings.fromJson(data);
  }

  Future<AutomationSettings> updateAutomationSettings(AutomationSettings settings) async {
    final res = await client.put(
      Uri.parse('$baseUrl/integrations/whatsapp/settings'),
      headers: _headers(),
      body: jsonEncode(settings.toJson()),
    );
    final data = _handleResponse(res);
    return AutomationSettings.fromJson(data);
  }

  Future<void> triggerEmergencyStop() async {
    final res = await client.post(
      Uri.parse('$baseUrl/integrations/whatsapp/emergency-stop'),
      headers: _headers(),
    );
    _handleResponse(res);
  }

  // ==========================================
  // WhatsApp QR Session Linking
  // ==========================================
  Future<WhatsAppConnectionSession> connectWhatsAppSession() async {
    final res = await client.post(
      Uri.parse('$baseUrl/integrations/whatsapp/session/connect'),
      headers: _headers(),
    );
    final data = _handleResponse(res);
    return WhatsAppConnectionSession.fromJson(data);
  }

  Future<WhatsAppConnectionSession> getWhatsAppSessionStatus() async {
    final res = await client.get(
      Uri.parse('$baseUrl/integrations/whatsapp/session/status'),
      headers: _headers(),
    );
    final data = _handleResponse(res);
    return WhatsAppConnectionSession.fromJson(data);
  }

  Future<void> disconnectWhatsAppSession() async {
    final res = await client.post(
      Uri.parse('$baseUrl/integrations/whatsapp/session/disconnect'),
      headers: _headers(),
    );
    _handleResponse(res);
  }

  Future<WhatsAppConnectionSession> refreshWhatsAppSession() async {
    final res = await client.post(
      Uri.parse('$baseUrl/integrations/whatsapp/session/refresh'),
      headers: _headers(),
    );
    final data = _handleResponse(res);
    return WhatsAppConnectionSession.fromJson(data);
  }

  // ==========================================
  // Privacy & Logs
  // ==========================================
  Future<Map<String, dynamic>> exportData() async {
    final res = await client.post(
      Uri.parse('$baseUrl/privacy/export'),
      headers: _headers(),
    );
    return _handleResponse(res) as Map<String, dynamic>;
  }

  Future<void> purgeAllData() async {
    final res = await client.delete(
      Uri.parse('$baseUrl/me/data'),
      headers: _headers(),
    );
    _handleResponse(res);
  }

  Future<List<AuditLog>> getAuditLogs() async {
    final res = await client.get(
      Uri.parse('$baseUrl/privacy/logs'),
      headers: _headers(),
    );
    final list = _handleResponse(res) as List<dynamic>;
    return list.map((e) => AuditLog.fromJson(e as Map<String, dynamic>)).toList();
  }
}
