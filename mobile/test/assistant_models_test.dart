import 'package:flutter_test/flutter_test.dart';
import 'package:vocare/features/assistant/data/assistant_models.dart';
import 'package:vocare/features/assistant/data/assistant_repository.dart';

void main() {
  test('recommendation parses AiCareerResponseDto', () {
    final rec = CareerRecommendation.fromJson({
      'recommendation': {
        'primaryPath': 'Data Analyst',
        'justification': 'Bo tak',
        'nextSteps': ['SQL', ' '],
        'longTermGoal': 'Lead',
      },
      'careerPaths': [
        {
          'id': 'p1',
          'careerName': 'Data Analyst',
          'probability': 72.5,
          'swot': {
            'strengths': ['A'],
            'threats': ['B'],
          },
        },
      ],
    });
    expect(rec.primaryPath, 'Data Analyst');
    expect(rec.nextSteps, ['SQL']);
    expect(rec.careerPaths.single.probability, 72.5);
    expect(rec.careerPaths.single.swot.threats, ['B']);
    expect(rec.careerPaths.single.swot.weaknesses, isEmpty);
  });

  test('scored offer strips HTML and maps confidence', () {
    final offer = ScoredJobOffer.fromJson({
      'id': 'o1',
      'title': 'Analyst',
      'briefDescription': '<p>Raporty&nbsp;w <b>Power BI</b></p>',
      'confidenceLevel': 'very_low',
      'matchScore': 41,
      'matchDetails': {
        'userMatchedSkills': ['SQL'],
        'missingSkills': ['DAX'],
      },
    });
    expect(offer.description, 'Raporty w Power BI');
    expect(offer.confidence, MatchConfidence.veryLow);
    expect(offer.missingSkills, ['DAX']);
  });

  test('offers are matched to paths by name, case-insensitively', () {
    final data = AssistantData(
      recommendation: CareerRecommendation.fromJson({
        'careerPaths': [
          {'id': 'p1', 'careerName': 'Data Analyst '},
        ],
      }),
      matches: [
        CareerPathMatch.fromJson({'careerPathName': 'data analyst'}),
      ],
    );
    expect(data.matchFor(data.recommendation!.careerPaths.single), isNotNull);
  });
}
