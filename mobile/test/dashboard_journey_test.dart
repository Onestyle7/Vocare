import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:vocare/features/dashboard/data/dashboard_repository.dart';
import 'package:vocare/features/dashboard/presentation/widgets/dashboard_cards.dart';

DashboardSummary summary({
  int recommendations = 0,
  int analyses = 0,
  int roadmaps = 0,
  int cvs = 0,
}) => DashboardSummary(
  recommendations: recommendations,
  analyses: analyses,
  roadmaps: roadmaps,
  cvs: cvs,
  profileCompletion: 80,
);

Widget host(Widget child) => MaterialApp(
  home: Scaffold(body: SingleChildScrollView(child: child)),
);

void main() {
  test('polishPlural picks one / few / many', () {
    String raport(int n) => polishPlural(n, 'raport', 'raporty', 'raportów');
    expect(raport(1), 'raport');
    expect(raport(2), 'raporty');
    expect(raport(4), 'raporty');
    expect(raport(5), 'raportów');
    expect(raport(12), 'raportów');
    expect(raport(14), 'raportów');
    expect(raport(22), 'raporty');
    expect(raport(25), 'raportów');
    expect(raport(0), 'raportów');
  });

  testWidgets('describes finished steps and offers the first untouched one', (
    tester,
  ) async {
    await tester.pumpWidget(
      host(
        JourneyCard(
          summary: summary(recommendations: 1, analyses: 0, roadmaps: 2),
        ),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('1 analiza profilu'), findsOneWidget);
    expect(find.text('Sprawdź zarobki i popyt'), findsOneWidget);
    expect(find.text('2 plany rozwoju'), findsOneWidget);
    expect(find.text('Stwórz CV pod wybrane stanowisko'), findsOneWidget);
    // Only the first unfinished step (market analysis) is the next step.
    expect(find.text('Zacznij'), findsOneWidget);
  });

  testWidgets('progress pill counts steps and hides once all are done', (
    tester,
  ) async {
    await tester.pumpWidget(
      host(JourneyProgress(summary: summary(recommendations: 1, cvs: 3))),
    );
    expect(find.text('2 z 4'), findsOneWidget);

    await tester.pumpWidget(
      host(
        Column(
          children: [
            JourneyProgress(
              summary: summary(
                recommendations: 1,
                analyses: 1,
                roadmaps: 2,
                cvs: 5,
              ),
            ),
            JourneyCard(
              summary: summary(
                recommendations: 1,
                analyses: 1,
                roadmaps: 2,
                cvs: 5,
              ),
            ),
          ],
        ),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.textContaining(' z 4'), findsNothing);
    expect(find.text('Zacznij'), findsNothing);
    expect(find.text('5 wersji CV'), findsOneWidget);
  });
}
