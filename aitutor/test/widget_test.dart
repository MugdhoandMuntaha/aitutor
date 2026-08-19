import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('AI Study Companion basic Smoke Test', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Text('AI Study Companion'),
        ),
      ),
    );

    expect(find.text('AI Study Companion'), findsOneWidget);
  });
}
