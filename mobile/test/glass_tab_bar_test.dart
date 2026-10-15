import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vocare/core/theme/app_colors.dart';
import 'package:vocare/features/shell/glass_tab_bar.dart';

Widget glyph(bool active) => const SizedBox.square(dimension: 24);

const tabs = [
  GlassTab(label: 'Pulpit', icon: glyph),
  GlassTab(label: 'Asystent', icon: glyph),
  GlassTab(label: 'Analiza rynku', icon: glyph),
  GlassTab(label: 'Roadmapa', icon: glyph),
  GlassTab(label: 'CV', icon: glyph),
];

Widget bar(int index) => MaterialApp(
  home: Scaffold(
    body: Center(
      child: GlassTabBar(tabs: tabs, currentIndex: index, onSelect: (_) {}),
    ),
  ),
);

/// The gradient puck is the only box decorated with the brand gradient.
Finder get puck => find.byWidgetPredicate(
  (w) =>
      w is DecoratedBox &&
      w.decoration is BoxDecoration &&
      (w.decoration as BoxDecoration).gradient == AppColors.brandGradient,
);

void main() {
  for (final (from, to) in [(0, 4), (4, 0)]) {
    testWidgets('a jump from tab ${from + 1} to ${to + 1} squashes against '
        'the end of the bar instead of leaving it', (tester) async {
      await tester.pumpWidget(bar(from));
      final barRect = tester.getRect(find.byType(GlassTabBar));
      await tester.pumpWidget(bar(to));

      var squashed = false;
      for (var ms = 0; ms <= 500; ms += 8) {
        await tester.pump(const Duration(milliseconds: 8));
        final r = tester.getRect(puck);
        expect(r.left, greaterThanOrEqualTo(barRect.left - 0.01));
        expect(r.right, lessThanOrEqualTo(barRect.right + 0.01));
        expect(r.top, greaterThanOrEqualTo(barRect.top - 0.01));
        expect(r.bottom, lessThanOrEqualTo(barRect.bottom + 0.01));
        if (r.width < r.height - 4) squashed = true;
      }
      expect(squashed, isTrue, reason: 'the puck should flatten on the wall');

      await tester.pumpAndSettle();
      final rest = tester.getRect(puck);
      expect(rest.width, closeTo(rest.height, 0.01), reason: 'round again');
    });
  }

  testWidgets('a short hop does not squash', (tester) async {
    await tester.pumpWidget(bar(3));
    await tester.pumpWidget(bar(4));
    for (var ms = 0; ms <= 500; ms += 8) {
      await tester.pump(const Duration(milliseconds: 8));
      final r = tester.getRect(puck);
      expect(r.width, closeTo(r.height, 0.01));
    }
  });
}
