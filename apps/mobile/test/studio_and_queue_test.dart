import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/screens/reply_studio_screen.dart';
import 'package:mobile/screens/review_queue_screen.dart';
import 'test_helpers.dart';

void main() {
  testWidgets('ReplyStudioScreen generates reply and shows safety assessment', (WidgetTester tester) async {
    final (api, auth) = createTestServices(authenticate: true);

    await tester.pumpWidget(MaterialApp(
      home: ReplyStudioScreen(apiService: api),
    ));
    await tester.pumpAndSettle();

    // Check header
    expect(find.text('Reply Studio'), findsOneWidget);
    expect(find.text('Generate Contextual Reply'), findsOneWidget);

    // Enter message
    await tester.enterText(
      find.widgetWithText(TextField, 'e.g. Free today for kopi at 1pm?'),
      'Are you free for lunch today?',
    );
    await tester.pump();

    // Tap generate button
    await tester.tap(find.text('Generate Authentic Reply'));
    await tester.pumpAndSettle();

    // Verify reply card and deterministic safety banner appeared
    expect(find.text('Reply Studio & Human Review'), findsOneWidget);
    expect(find.text('Safety Check: Passed'), findsOneWidget);
    expect(find.text('Review Required: YES'), findsOneWidget);

    // Ensure Approve Draft is visible before tapping
    await tester.ensureVisible(find.text('Approve Draft'));
    await tester.pumpAndSettle();

    expect(find.text('Copy'), findsOneWidget);
    expect(find.text('Share'), findsOneWidget);
    expect(find.text('Approve Draft'), findsOneWidget);
    expect(find.text('Reject Draft'), findsOneWidget);

    // Tap Approve Draft
    await tester.tap(find.text('Approve Draft'));
    await tester.pumpAndSettle();
    expect(find.text('Draft marked as approved.'), findsOneWidget);
  });

  testWidgets('ReviewQueueScreen displays drafts with status filters', (WidgetTester tester) async {
    final (api, auth) = createTestServices(authenticate: true);

    await tester.pumpWidget(MaterialApp(
      home: ReviewQueueScreen(apiService: api),
    ));
    await tester.pumpAndSettle();

    expect(find.text('Manual-Review Queue'), findsOneWidget);
    expect(find.textContaining('All ('), findsOneWidget);
    expect(find.textContaining('Pending ('), findsOneWidget);
    expect(find.text('Free for dinner tonight?'), findsOneWidget);
  });
}
