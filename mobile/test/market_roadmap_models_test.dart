import 'package:flutter_test/flutter_test.dart';
import 'package:vocare/features/billing/data/billing_repository.dart';
import 'package:vocare/features/market/data/market_models.dart';
import 'package:vocare/features/roadmap/data/roadmap_models.dart';
import 'package:vocare/features/roadmap/data/roadmap_repository.dart';

void main() {
  group('MarketAnalysis', () {
    test('parses MarketAnalysisResponseDto and links skills to industries', () {
      final analysis = MarketAnalysis.fromResponse({
        'marketAnalysis': {
          'industryStatistics': [
            {
              'industry': 'Data Analyst',
              'minSalary': 6500,
              'salaryProgression': [
                {'careerLevel': 'Junior', 'averageSalary': 7000},
              ],
              'workAttributes': {'analyticalThinking': 10},
              'entryDifficulty': {
                'difficultyScore': 44,
                'missingSkills': ['DAX'],
              },
            },
          ],
          'skillDemand': [
            {
              'skill': 'SQL',
              'demandLevel': 'Wysoki',
              'industry': 'Data Analyst',
            },
            {'skill': 'Figma', 'demandLevel': 'Wysoki', 'industry': 'Designer'},
          ],
          'marketTrends': [],
        },
      });
      final industry = analysis.industries.single;
      expect(industry.salaryProgression.single.average, 7000);
      expect(industry.workAttributes!.scores[1], ('Analityka', 10));
      expect(industry.entryDifficulty!.missingSkills, ['DAX']);
      expect(analysis.skillsFor('Data Analyst').single.skill, 'SQL');
      expect(analysis.isEmpty, isFalse);
    });

    test('empty lists mean "no analysis yet"', () {
      expect(
        MarketAnalysis.fromResponse({'marketAnalysis': {}}).isEmpty,
        isTrue,
      );
    });
  });

  group('Roadmap', () {
    test('details sort phases and steps and read enums', () {
      final details = RoadmapDetails.fromJson({
        'id': 'r1',
        'generationStatus': 'Ready',
        'phases': [
          {
            'id': 'b',
            'orderIndex': 1,
            'steps': [
              {
                'id': 's2',
                'orderIndex': 1,
                'status': 'Completed',
                'stepType': 'Optional',
              },
              {
                'id': 's1',
                'orderIndex': 0,
                'status': 'InProgress',
                'stepType': 'Required',
              },
            ],
          },
          {'id': 'a', 'orderIndex': 0, 'steps': []},
        ],
      });
      expect(details.phases.map((p) => p.id), ['a', 'b']);
      expect(details.phases[1].steps.map((s) => s.id), ['s1', 's2']);
      expect(details.phases[1].steps.first.status, StepStatus.inProgress);
      expect(details.phases[1].steps.last.required, isFalse);
      expect(details.completedCount, 1);
    });

    test('list state counts slots like the web (failed roadmaps are free)', () {
      RoadmapListEntry entry(String name, String status) => RoadmapListEntry(
        RoadmapSummary.fromJson({
          'careerPathName': name,
          'generationStatus': status,
        }),
        null,
      );
      final state = RoadmapListState(
        entries: [entry('Data Analyst', 'Failed'), entry('UX', 'Generating')],
        limit: roadmapLimitFor(
          const AccessStatus(tokenBalance: 0, subscriptionStatus: 'None'),
        ),
      );
      expect(state.usedSlots, 1);
      expect(state.limitReached, isTrue);
      expect(state.anyGenerating, isTrue);
      expect(state.existingFor('data analyst'), isNull);
      expect(state.existingFor(' UX '), isNotNull);
    });
  });
}
