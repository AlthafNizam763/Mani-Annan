import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:mobile/screens/contacts_screen.dart';
import 'package:mobile/screens/whatsapp_automation_screen.dart';
import 'package:mobile/screens/privacy_screen.dart';
import 'test_helpers.dart';

void main() {
  testWidgets('ContactsScreen displays contacts and allows pause toggle', (WidgetTester tester) async {
    final (api, auth) = createTestServices(authenticate: true);

    await tester.pumpWidget(MaterialApp(
      home: ContactsScreen(apiService: api),
    ));
    await tester.pumpAndSettle();

    expect(find.text('Contacts & Policies'), findsOneWidget);
    expect(find.text('Sarah'), findsOneWidget);
    expect(find.text('David Tan'), findsOneWidget);

    // Toggle pause on first contact
    await tester.tap(find.text('Pause').first);
    await tester.pumpAndSettle();

    expect(find.text('Sarah is now Paused'), findsOneWidget);
  });

  testWidgets('WhatsAppAutomationScreen toggles global Mani switch and shows capability matrix', (WidgetTester tester) async {
    final (api, auth) = createTestServices(authenticate: true);

    await tester.pumpWidget(MaterialApp(
      home: WhatsAppAutomationScreen(apiService: api),
    ));
    await tester.pumpAndSettle();

    expect(find.text('WhatsApp & Automation'), findsOneWidget);
    expect(find.text('Global Mani Assistant'), findsOneWidget);
    expect(find.text('MANI OFF'), findsOneWidget);

    // Tap MANI OFF -> turns MANI ON
    await tester.tap(find.text('MANI OFF'));
    await tester.pumpAndSettle();

    expect(find.text('MANI ON'), findsOneWidget);
    expect(find.textContaining('Global Mani Assistant is now ON'), findsOneWidget);

    // Verify capability report providers
    expect(find.text('OS Share & Clipboard (Human-in-the-Loop)'), findsOneWidget);
    expect(find.text('CONNECTED ACTIVE'), findsOneWidget);
    expect(find.text('WhatsApp Web Linked Devices (Personal QR Flow)'), findsOneWidget);
    expect(find.text('UNAVAILABLE UNSUPPORTED'), findsOneWidget);
    expect(find.textContaining('Why Linked Devices QR automation is marked UNAVAILABLE'), findsOneWidget);
  });

  testWidgets('PrivacyScreen exports data and displays user identity', (WidgetTester tester) async {
    final (api, auth) = createTestServices(authenticate: true);

    await tester.pumpWidget(MaterialApp(
      home: PrivacyScreen(apiService: api, authService: auth),
    ));
    await tester.pumpAndSettle();

    expect(find.text('Privacy & Settings'), findsOneWidget);
    expect(find.text('alpha@example.com'), findsOneWidget);
    expect(find.text('UID: user_alpha'), findsOneWidget);
    expect(find.text('Export All Data'), findsOneWidget);
    expect(find.text('Purge All Data'), findsOneWidget);

    // Tap Export All Data
    await tester.tap(find.text('Export All Data'));
    await tester.pumpAndSettle();

    expect(find.text('Data Sovereignty Export'), findsOneWidget);
    expect(find.text('Copy JSON'), findsOneWidget);
  });

  testWidgets('ContactsScreen opens edit contact sheet and saves policy updates', (WidgetTester tester) async {
    final (api, auth) = createTestServices(authenticate: true);

    await tester.pumpWidget(MaterialApp(
      home: ContactsScreen(apiService: api),
    ));
    await tester.pumpAndSettle();

    // Find and tap Edit icon on Sarah
    expect(find.byIcon(Icons.edit_outlined), findsWidgets);
    await tester.tap(find.byIcon(Icons.edit_outlined).first);
    await tester.pumpAndSettle();

    // Verify Edit Contact sheet is displayed
    expect(find.text('Edit Contact Policy'), findsOneWidget);
    expect(find.text('Preferred Tone'), findsOneWidget);
    expect(find.text('Enable Quiet Hours for this Contact'), findsOneWidget);

    // Save changes
    await tester.tap(find.text('Save Contact Policy'));
    await tester.pumpAndSettle();

    expect(find.text('Contact Sarah updated'), findsOneWidget);
  });

  testWidgets('WhatsAppAutomationScreen shows Connect WhatsApp button and opens QR modal with real QR payload and same-phone notice', (WidgetTester tester) async {
    final (api, auth) = createTestServices(authenticate: true);

    await tester.pumpWidget(MaterialApp(
      home: WhatsAppAutomationScreen(apiService: api),
    ));
    await tester.pumpAndSettle();

    // Verify Connect WhatsApp button is present in the QR card
    expect(find.text('Personal WhatsApp Linked Devices'), findsOneWidget);
    expect(find.text('Connect WhatsApp'), findsOneWidget);

    // Tap Connect WhatsApp
    await tester.tap(find.text('Connect WhatsApp'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    // Verify QR modal opens with instructions and same-phone warning
    expect(find.text('Connect WhatsApp via QR'), findsOneWidget);
    expect(find.text('How to Link WhatsApp:'), findsOneWidget);
    expect(find.textContaining('Same-Phone Notice:'), findsOneWidget);
    expect(find.byType(QrImageView), findsOneWidget);
    expect(find.text('Refresh QR'), findsOneWidget);

    // Cancel/close modal
    await tester.tap(find.byIcon(Icons.close));
    await tester.pumpAndSettle();
  });

  testWidgets('WhatsAppAutomationScreen handles unconfigured QR provider safely with error notice', (WidgetTester tester) async {
    final (api, auth) = createTestServices(authenticate: true, qrNotConfigured: true);

    await tester.pumpWidget(MaterialApp(
      home: WhatsAppAutomationScreen(apiService: api),
    ));
    await tester.pumpAndSettle();

    // Tap Connect WhatsApp
    await tester.tap(find.text('Connect WhatsApp'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    // Shows clear error and unconfigured explanation without fake QR
    expect(find.text('WhatsApp Integration Not Configured'), findsOneWidget);
    expect(find.textContaining('Why personal QR automation is restricted:'), findsOneWidget);
    expect(find.byType(QrImageView), findsNothing);

    // Close button dismisses dialog
    await tester.tap(find.text('Close'));
    await tester.pumpAndSettle();
  });
}
