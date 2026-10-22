import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/main.dart';
import 'package:mobile/screens/auth_screen.dart';
import 'package:mobile/screens/main_shell.dart';
import 'test_helpers.dart';

void main() {
  testWidgets('Renders AuthScreen when unauthenticated', (WidgetTester tester) async {
    final (api, auth) = createTestServices(authenticate: false);

    await tester.pumpWidget(ProjectEchoApp(
      apiService: api,
      authService: auth,
    ));
    await tester.pumpAndSettle();

    expect(find.byType(AuthScreen), findsOneWidget);
    expect(find.text('Sign In to Mani'), findsOneWidget);
    expect(find.text('Email Address'), findsOneWidget);
    expect(find.text('Password'), findsOneWidget);
    expect(find.text('Development / Test Mode Quick Login'), findsOneWidget);

    // Scroll and tap Quick Login button
    await tester.ensureVisible(find.text('User Alpha'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('User Alpha'));
    await tester.pumpAndSettle();

    // Now authenticated -> MainShellScreen is rendered
    expect(find.byType(MainShellScreen), findsOneWidget);
    expect(find.text('Mani-Annan'), findsOneWidget);
  });

  testWidgets('Renders MainShellScreen with 5 primary navigation tabs when authenticated', (WidgetTester tester) async {
    final (api, auth) = createTestServices(authenticate: true);

    await tester.pumpWidget(ProjectEchoApp(
      apiService: api,
      authService: auth,
    ));
    await tester.pumpAndSettle();

    expect(find.byType(MainShellScreen), findsOneWidget);
    expect(find.text('Studio'), findsOneWidget);
    expect(find.text('Queue'), findsOneWidget);
    expect(find.text('Contacts'), findsOneWidget);
    expect(find.text('Style'), findsOneWidget);
    expect(find.text('Mani Auto'), findsOneWidget);
  });
}
