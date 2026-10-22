import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/services/api_service.dart';
import 'package:mobile/services/auth_service.dart';

MockClient createMockHttpClient({
  bool maniGlobal = false,
  bool emergencyStop = false,
  bool safeReply = true,
  String qrStatus = 'disconnected',
  bool qrNotConfigured = false,
}) {
  final List<Map<String, dynamic>> contacts = [
    {
      'id': 'contact_1',
      'name': 'Sarah',
      'relationship': 'romantic_partner',
      'preferredTone': 'warm_and_affectionate',
      'autoSendEnabled': false,
      'isPaused': false,
      'quietHours': {'enabled': false, 'start': '22:00', 'end': '08:00', 'timezone': 'UTC'},
      'allowedCategories': ['general_chat'],
      'sensitiveTopicsRequireReview': true,
      'createdAt': '2026-10-20T10:00:00Z',
      'updatedAt': '2026-10-20T10:00:00Z',
    },
    {
      'id': 'contact_2',
      'name': 'David Tan',
      'relationship': 'boss_or_manager',
      'preferredTone': 'professional',
      'autoSendEnabled': false,
      'isPaused': false,
      'quietHours': {'enabled': true, 'start': '22:00', 'end': '08:00', 'timezone': 'UTC'},
      'allowedCategories': ['general_chat', 'work_tasks'],
      'sensitiveTopicsRequireReview': true,
      'createdAt': '2026-10-20T10:05:00Z',
      'updatedAt': '2026-10-20T10:05:00Z',
    }
  ];

  final List<Map<String, dynamic>> drafts = [
    {
      'id': 'draft_1',
      'contactId': 'contact_1',
      'contactName': 'Sarah',
      'relationship': 'romantic_partner',
      'incomingMessage': 'Free for dinner tonight?',
      'generatedReply': 'Yes dear, on for dinner! See you later ❤️',
      'safetyCheck': {
        'isSafe': true,
        'requiresManualReview': true,
        'riskFlags': <String>[],
        'reason': 'Passed deterministic safety checks.',
      },
      'reviewStatus': 'pending',
      'providerUsed': 'gemini',
      'createdAt': '2026-10-20T10:10:00Z',
    }
  ];

  final List<Map<String, dynamic>> auditLogs = [
    {
      'id': 'log_1',
      'timestamp': '2026-10-20T10:15:00Z',
      'eventType': 'generate_reply',
      'decision': 'manual_review_forced',
      'contactId': 'contact_1',
      'reasonCode': 'CLEARED_POLICY_CHECK',
    }
  ];

  var currentManiGlobal = maniGlobal;
  var currentEmergencyStop = emergencyStop;
  var currentQRSessionStatus = qrStatus;
  String? currentConnectedPhone = qrStatus == 'connected' ? '+60123456789' : null;

  return MockClient((request) async {
    final path = request.url.path;
    final method = request.method;

    // 1. Me / Profile
    if (path.endsWith('/me')) {
      if (method == 'GET') {
        return http.Response(
          jsonEncode({
            'uid': 'test_user_alpha',
            'email': 'alpha@example.com',
            'displayName': 'Owner Alpha',
            'createdAt': '2026-10-20T09:00:00Z',
            'styleProfile': {
              'version': 1,
              'primaryLanguages': ['en'],
              'usesManglish': true,
              'commonSlang': ['lah', 'bro', 'machan', 'dey', 'ok ok'],
              'avgSentenceLength': 'short',
              'punctuationHabits': {
                'multipleExclamations': false,
                'usesEllipsis': true,
                'omitsEndingPeriod': true,
                'questionMarksOnlyWhenNeeded': true,
              },
              'emojiHabits': {
                'frequentEmojis': ['👍', '😂', '🔥'],
                'emojiFrequency': 'moderate',
              },
              'greetingStyle': 'informal',
              'closingStyle': 'casual',
              'updatedAt': '2026-10-20T10:00:00Z',
            }
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      if (method == 'DELETE') {
        return http.Response(
          jsonEncode({'success': true, 'message': 'Data purged'}),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
    }

    // 2. Contacts
    if (path.endsWith('/contacts')) {
      if (method == 'GET') {
        return http.Response(jsonEncode(contacts), 200, headers: {'content-type': 'application/json'});
      }
      if (method == 'POST') {
        final body = jsonDecode(request.body) as Map<String, dynamic>;
        final newC = <String, dynamic>{
          'id': 'contact_${contacts.length + 1}',
          ...body,
          'createdAt': '2026-10-20T10:20:00Z',
          'updatedAt': '2026-10-20T10:20:00Z',
        };
        contacts.add(newC);
        return http.Response(jsonEncode(newC), 201, headers: {'content-type': 'application/json'});
      }
    }

    if (path.contains('/contacts/')) {
      final id = path.split('/contacts/').last;
      if (method == 'PATCH') {
        final body = jsonDecode(request.body) as Map<String, dynamic>;
        final idx = contacts.indexWhere((c) => c['id'] == id);
        if (idx != -1) {
          contacts[idx].addAll(body);
          return http.Response(jsonEncode(contacts[idx]), 200, headers: {'content-type': 'application/json'});
        }
      }
      if (method == 'DELETE') {
        contacts.removeWhere((c) => c['id'] == id);
        return http.Response(jsonEncode({'success': true}), 200, headers: {'content-type': 'application/json'});
      }
    }

    // 3. Replies & Drafts
    if (path.endsWith('/replies/generate') && method == 'POST') {
      final body = jsonDecode(request.body) as Map<String, dynamic>;
      final newDraft = <String, dynamic>{
        'id': 'draft_${drafts.length + 1}',
        'contactId': body['contactId'],
        'contactName': 'Sarah',
        'relationship': 'romantic_partner',
        'incomingMessage': body['incomingMessage'],
        'generatedReply': 'On for that lah! Let us meet at 7pm 👍',
        'safetyCheck': {
          'isSafe': safeReply,
          'requiresManualReview': true,
          'riskFlags': safeReply ? <String>[] : ['financial_commitment'],
          'reason': safeReply ? 'Passed deterministic safety checks.' : 'Contains financial commitment risk',
        },
        'reviewStatus': 'pending',
        'providerUsed': 'gemini',
        'createdAt': '2026-10-20T10:25:00Z',
      };
      drafts.insert(0, newDraft);
      return http.Response(jsonEncode(newDraft), 201, headers: {'content-type': 'application/json'});
    }

    if (path.endsWith('/drafts')) {
      if (method == 'GET') {
        return http.Response(jsonEncode(drafts), 200, headers: {'content-type': 'application/json'});
      }
    }

    if (path.contains('/drafts/') && path.endsWith('/feedback')) {
      return http.Response(jsonEncode({'success': true}), 201, headers: {'content-type': 'application/json'});
    }

    if (path.contains('/drafts/') && method == 'PATCH') {
      final id = path.split('/drafts/').last;
      final body = jsonDecode(request.body);
      final idx = drafts.indexWhere((d) => d['id'] == id);
      if (idx != -1) {
        drafts[idx].addAll(body);
        return http.Response(jsonEncode(drafts[idx]), 200, headers: {'content-type': 'application/json'});
      }
    }

    // 4. Imports
    if (path.endsWith('/imports')) {
      if (method == 'GET') {
        return http.Response(jsonEncode([]), 200, headers: {'content-type': 'application/json'});
      }
      if (method == 'POST') {
        return http.Response(
          jsonEncode({
            'importId': 'imp_1',
            'status': 'completed',
            'extractedOwnerMessagesCount': 3,
            'extractedContactMessagesCount': 2,
            'styleProfileUpdated': true,
            'detectedSlang': ['lah', 'bro', 'steady'],
            'summary': 'Extracted 3 authentic owner messages. Analyzed Manglish markers.',
          }),
          201,
          headers: {'content-type': 'application/json'},
        );
      }
    }

    // 5. WhatsApp & Automation
    if (path.endsWith('/integrations/whatsapp/capabilities')) {
      return http.Response(
        jsonEncode({
          'accountType': 'normal_personal_whatsapp',
          'canAutoReplyWithDashboardClosed': false,
          'supportedProviders': [
            {
              'provider': 'clipboard_share_manual',
              'displayName': 'OS Share & Clipboard (Human-in-the-Loop)',
              'description': 'Generates authentic replies in the studio, checked by the safety policy, then copied or shared directly.',
              'status': 'connected_active',
              'worksWhenDashboardClosed': false,
              'requiresDedicatedNumber': false,
              'riskAssessment': 'Zero ban risk. 100% compliant with standard WhatsApp consumer accounts.',
            },
            {
              'provider': 'official_cloud_api',
              'displayName': 'Official Meta WhatsApp Business Cloud API',
              'description': 'Server-to-server 24/7 automated messaging. Requires dedicated business line.',
              'status': 'ready_for_onboarding',
              'worksWhenDashboardClosed': true,
              'requiresDedicatedNumber': true,
              'riskAssessment': 'Official Meta API. Requires dedicated business number and Meta Business verification.',
            },
            {
              'provider': 'linked_devices_qr_personal',
              'displayName': 'WhatsApp Web Linked Devices (Personal QR Flow)',
              'description': 'Direct pairing of personal WhatsApp account via Linked Devices QR code for autonomous background replies.',
              'status': 'unavailable_unsupported',
              'worksWhenDashboardClosed': false,
              'requiresDedicatedNumber': false,
              'riskAssessment': 'UNAVAILABLE: Meta exposes no official third-party Linked Devices API. Unofficial socket scraping violates WhatsApp ToS.',
            }
          ]
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    if (path.endsWith('/integrations/whatsapp/settings')) {
      if (method == 'GET') {
        return http.Response(
          jsonEncode({
            'maniGlobalEnabled': currentManiGlobal,
            'autoSendEnabled': false,
            'activeProvider': 'clipboard_share_manual',
            'replyDelaySeconds': 5,
            'quietHoursEnabled': true,
            'emergencyStop': currentEmergencyStop,
            'lastWebhookTimestamp': null,
            'lastEventReceived': 'Inbound message from Sarah',
            'lastSuccessfulSend': 'Copied draft to clipboard',
            'lastDeliveryFailure': null,
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
      if (method == 'PUT') {
        final body = jsonDecode(request.body);
        currentManiGlobal = body['maniGlobalEnabled'] ?? currentManiGlobal;
        return http.Response(
          jsonEncode({
            'maniGlobalEnabled': currentManiGlobal,
            'autoSendEnabled': false,
            'activeProvider': 'clipboard_share_manual',
            'replyDelaySeconds': 5,
            'quietHoursEnabled': true,
            'emergencyStop': currentEmergencyStop,
          }),
          200,
          headers: {'content-type': 'application/json'},
        );
      }
    }

    if (path.endsWith('/integrations/whatsapp/emergency-stop')) {
      currentEmergencyStop = true;
      currentManiGlobal = false;
      return http.Response(
        jsonEncode({'success': true, 'message': 'Emergency stop activated'}),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    // WhatsApp QR Session Endpoints
    if (path.endsWith('/integrations/whatsapp/session/connect')) {
      if (qrNotConfigured) {
        return http.Response(
          jsonEncode({
            'sessionId': 'unconfigured_test',
            'status': 'not_configured',
            'error': 'ProviderNotConfigured',
            'message': 'WhatsApp Linked Devices QR provider is not configured on the backend. Personal WhatsApp account QR automation is not supported without an approved provider integration.',
            'instructions': [
              'Open WhatsApp on your phone',
              'Tap Menu or Settings',
              'Select Linked Devices',
              'Scan this QR code',
            ],
          }),
          400,
          headers: {'content-type': 'application/json'},
        );
      }
      currentQRSessionStatus = 'qr_ready';
      return http.Response(
        jsonEncode({
          'sessionId': 'sess_test_12345',
          'status': 'qr_ready',
          'qrPayload': '1@mock_whatsapp_qr_payload_for_testing',
          'expiresAt': DateTime.now().add(const Duration(seconds: 60)).toIso8601String(),
          'instructions': [
            'Open WhatsApp on your phone',
            'Tap Menu or Settings',
            'Select Linked Devices',
            'Scan this QR code',
          ],
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    if (path.endsWith('/integrations/whatsapp/session/status')) {
      return http.Response(
        jsonEncode({
          'sessionId': 'sess_test_12345',
          'status': currentQRSessionStatus,
          'qrPayload': currentQRSessionStatus == 'qr_ready' ? '1@mock_whatsapp_qr_payload_for_testing' : null,
          'expiresAt': DateTime.now().add(const Duration(seconds: 60)).toIso8601String(),
          'connectedPhone': currentConnectedPhone,
          'instructions': [
            'Open WhatsApp on your phone',
            'Tap Menu or Settings',
            'Select Linked Devices',
            'Scan this QR code',
          ],
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    if (path.endsWith('/integrations/whatsapp/session/disconnect')) {
      currentQRSessionStatus = 'disconnected';
      currentConnectedPhone = null;
      return http.Response(
        jsonEncode({
          'success': true,
          'status': 'disconnected',
          'message': 'WhatsApp session disconnected successfully.',
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    if (path.endsWith('/integrations/whatsapp/session/refresh')) {
      currentQRSessionStatus = 'qr_ready';
      return http.Response(
        jsonEncode({
          'sessionId': 'sess_test_refreshed_67890',
          'status': 'qr_ready',
          'qrPayload': '1@refreshed_mock_whatsapp_qr_payload',
          'expiresAt': DateTime.now().add(const Duration(seconds: 60)).toIso8601String(),
          'instructions': [
            'Open WhatsApp on your phone',
            'Tap Menu or Settings',
            'Select Linked Devices',
            'Scan this QR code',
          ],
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    // 6. Privacy & Logs
    if (path.endsWith('/privacy/logs')) {
      return http.Response(jsonEncode(auditLogs), 200, headers: {'content-type': 'application/json'});
    }

    if (path.endsWith('/privacy/export')) {
      return http.Response(
        jsonEncode({
          'success': true,
          'data': {
            'profile': {'uid': 'test_user_alpha'},
            'contacts': contacts,
            'drafts': drafts,
          }
        }),
        200,
        headers: {'content-type': 'application/json'},
      );
    }

    return http.Response(jsonEncode({'error': 'Not found'}), 404);
  });
}

(ApiService, AuthService) createTestServices({
  bool maniGlobal = false,
  bool emergencyStop = false,
  bool safeReply = true,
  bool authenticate = true,
  String qrStatus = 'disconnected',
  bool qrNotConfigured = false,
}) {
  final mockClient = createMockHttpClient(
    maniGlobal: maniGlobal,
    emergencyStop: emergencyStop,
    safeReply: safeReply,
    qrStatus: qrStatus,
    qrNotConfigured: qrNotConfigured,
  );

  final api = ApiService(
    baseUrl: 'http://localhost:4001/api/v1',
    client: mockClient,
  );

  final auth = AuthService(
    apiService: api,
    client: mockClient,
  );

  if (authenticate) {
    auth.loginWithMockToken(
      uid: 'user_alpha',
      email: 'alpha@example.com',
      displayName: 'Owner Alpha',
    );
  }

  return (api, auth);
}
