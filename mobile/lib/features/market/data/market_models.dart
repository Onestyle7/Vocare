/// Mirrors `MarketAnalysisResponseDto` (`/api/MarketAnalysis/*`); see
/// `frontend/lib/types/marketAnalysis.ts`.
class MarketAnalysis {
  const MarketAnalysis({
    required this.industries,
    required this.skillDemand,
    required this.trends,
  });

  final List<IndustryStatistics> industries;
  final List<SkillDemand> skillDemand;
  final List<MarketTrend> trends;

  /// The backend answers with empty lists when the latest recommendation has
  /// no analysis yet — the web treats that as "no analysis".
  bool get isEmpty =>
      industries.isEmpty && skillDemand.isEmpty && trends.isEmpty;

  List<SkillDemand> skillsFor(String industry) =>
      skillDemand.where((s) => s.industry == industry).toList();

  factory MarketAnalysis.fromResponse(Map json) {
    final details = json['marketAnalysis'] is Map
        ? json['marketAnalysis'] as Map
        : json;
    return MarketAnalysis(
      industries: _list(
        details['industryStatistics'],
        IndustryStatistics.fromJson,
      ),
      skillDemand: _list(details['skillDemand'], SkillDemand.fromJson),
      trends: _list(details['marketTrends'], MarketTrend.fromJson),
    );
  }
}

class IndustryStatistics {
  const IndustryStatistics({
    required this.industry,
    required this.minSalary,
    required this.maxSalary,
    required this.employmentRate,
    required this.growthForecast,
    required this.salaryProgression,
    this.workAttributes,
    this.entryDifficulty,
    this.narrator,
  });

  final String industry;
  final int minSalary;
  final int maxSalary;
  final int employmentRate;
  final String growthForecast;
  final List<SalaryStep> salaryProgression;
  final WorkAttributes? workAttributes;
  final EntryDifficulty? entryDifficulty;
  final AiNarrator? narrator;

  factory IndustryStatistics.fromJson(Map json) => IndustryStatistics(
    industry: _s(json['industry']),
    minSalary: _i(json['minSalary']),
    maxSalary: _i(json['maxSalary']),
    employmentRate: _i(json['employmentRate']),
    growthForecast: _s(json['growthForecast']),
    salaryProgression: _list(json['salaryProgression'], SalaryStep.fromJson),
    workAttributes: json['workAttributes'] is Map
        ? WorkAttributes.fromJson(json['workAttributes'] as Map)
        : null,
    entryDifficulty: json['entryDifficulty'] is Map
        ? EntryDifficulty.fromJson(json['entryDifficulty'] as Map)
        : null,
    narrator: json['aiNarrator'] is Map
        ? AiNarrator.fromJson(json['aiNarrator'] as Map)
        : null,
  );
}

class SalaryStep {
  const SalaryStep({
    required this.level,
    required this.years,
    required this.min,
    required this.average,
    required this.max,
  });

  final String level;
  final String years;
  final int min;
  final int average;
  final int max;

  factory SalaryStep.fromJson(Map json) => SalaryStep(
    level: _s(json['careerLevel']),
    years: _s(json['yearsOfExperience']),
    min: _i(json['minSalary']),
    average: _i(json['averageSalary']),
    max: _i(json['maxSalary']),
  );
}

/// 0–10 scores; labels and order follow `workAttributeLabels` on the web.
class WorkAttributes {
  const WorkAttributes(this.scores);

  final List<(String label, int score)> scores;

  bool get isEmpty => scores.every((s) => s.$2 == 0);

  factory WorkAttributes.fromJson(Map json) => WorkAttributes([
    ('Stres', _i(json['stressLevel'])),
    ('Analityka', _i(json['analyticalThinking'])),
    ('Kreatywność', _i(json['creativity'])),
    ('Zespół', _i(json['teamwork'])),
    ('Samodzielność', _i(json['independence'])),
    ('Dynamika', _i(json['routineVsDynamic'])),
    ('Kontakt z klientem', _i(json['customerFacing'])),
    ('Głębokość techniczna', _i(json['technicalDepth'])),
  ]);
}

class EntryDifficulty {
  const EntryDifficulty({
    required this.score,
    required this.level,
    required this.missingSkillsCount,
    required this.missingSkills,
    required this.matchingSkillsCount,
    required this.estimatedTime,
    required this.explanation,
  });

  /// 0–100, higher is harder.
  final int score;
  final String level;
  final int missingSkillsCount;
  final List<String> missingSkills;
  final int matchingSkillsCount;
  final String estimatedTime;
  final String explanation;

  factory EntryDifficulty.fromJson(Map json) => EntryDifficulty(
    score: _i(json['difficultyScore']),
    level: _s(json['difficultyLevel']),
    missingSkillsCount: _i(json['missingSkillsCount']),
    missingSkills: _strings(json['missingSkills']),
    matchingSkillsCount: _i(json['matchingSkillsCount']),
    estimatedTime: _s(json['estimatedTimeToReady']),
    explanation: _s(json['explanation']),
  );
}

class AiNarrator {
  const AiNarrator({
    required this.salary,
    required this.workStyle,
    required this.entry,
    required this.motivation,
    required this.recommendation,
  });

  final String salary;
  final String workStyle;
  final String entry;
  final String motivation;
  final String recommendation;

  factory AiNarrator.fromJson(Map json) => AiNarrator(
    salary: _s(json['salaryInsight']),
    workStyle: _s(json['workStyleInsight']),
    entry: _s(json['entryAdvice']),
    motivation: _s(json['motivationalMessage']),
    recommendation: _s(json['personalizedRecommendation']),
  );
}

class MarketTrend {
  const MarketTrend({
    required this.name,
    required this.description,
    required this.impact,
  });

  final String name;
  final String description;
  final String impact;

  factory MarketTrend.fromJson(Map json) => MarketTrend(
    name: _s(json['trendName']),
    description: _s(json['description']),
    impact: _s(json['impact']),
  );
}

class SkillDemand {
  const SkillDemand({
    required this.skill,
    required this.level,
    required this.industry,
  });

  final String skill;
  final String level;
  final String industry;

  factory SkillDemand.fromJson(Map json) => SkillDemand(
    skill: _s(json['skill']),
    level: _s(json['demandLevel']),
    industry: _s(json['industry']),
  );
}

String _s(Object? v) => v == null ? '' : '$v'.trim();

int _i(Object? v) => (v as num?)?.round() ?? 0;

List<String> _strings(Object? v) => v is List
    ? v.map((e) => '$e'.trim()).where((e) => e.isNotEmpty).toList()
    : const [];

List<T> _list<T>(Object? v, T Function(Map) fromJson) =>
    v is List ? v.whereType<Map>().map(fromJson).toList() : <T>[];
