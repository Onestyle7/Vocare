/// Mirrors `AiCareerResponseDto` (`/api/Ai/*`) and `CareerPathMatchResultDto`
/// (`/api/JobOffers/matching/*`); see `frontend/lib/types/recommendation.ts`
/// and `jobOffers.ts`.
class CareerRecommendation {
  const CareerRecommendation({
    required this.primaryPath,
    required this.justification,
    required this.nextSteps,
    required this.longTermGoal,
    required this.careerPaths,
  });

  final String primaryPath;
  final String justification;
  final List<String> nextSteps;
  final String longTermGoal;
  final List<CareerPath> careerPaths;

  factory CareerRecommendation.fromJson(Map json) {
    final rec = json['recommendation'] is Map
        ? json['recommendation'] as Map
        : const {};
    return CareerRecommendation(
      primaryPath: _s(rec['primaryPath']),
      justification: _s(rec['justification']),
      nextSteps: _strings(rec['nextSteps']),
      longTermGoal: _s(rec['longTermGoal']),
      careerPaths: _list(json['careerPaths'], CareerPath.fromJson),
    );
  }
}

class CareerPath {
  const CareerPath({
    required this.id,
    required this.name,
    required this.description,
    required this.probability,
    required this.requiredSkills,
    required this.recommendedCourses,
    required this.marketAnalysis,
    required this.swot,
  });

  final String id;
  final String name;
  final String description;

  /// Success probability, 0–100.
  final double probability;
  final List<String> requiredSkills;
  final List<String> recommendedCourses;
  final List<String> marketAnalysis;
  final Swot swot;

  factory CareerPath.fromJson(Map json) => CareerPath(
    id: _s(json['id']),
    name: _s(json['careerName']),
    description: _s(json['description']),
    probability: (json['probability'] as num?)?.toDouble() ?? 0,
    requiredSkills: _strings(json['requiredSkills']),
    recommendedCourses: _strings(json['recommendedCourses']),
    marketAnalysis: _strings(json['marketAnalysis']),
    swot: Swot.fromJson(json['swot'] is Map ? json['swot'] as Map : const {}),
  );
}

class Swot {
  const Swot({
    required this.strengths,
    required this.weaknesses,
    required this.opportunities,
    required this.threats,
  });

  final List<String> strengths;
  final List<String> weaknesses;
  final List<String> opportunities;
  final List<String> threats;

  bool get isEmpty =>
      strengths.isEmpty &&
      weaknesses.isEmpty &&
      opportunities.isEmpty &&
      threats.isEmpty;

  factory Swot.fromJson(Map json) => Swot(
    strengths: _strings(json['strengths']),
    weaknesses: _strings(json['weaknesses']),
    opportunities: _strings(json['opportunities']),
    threats: _strings(json['threats']),
  );
}

class CareerPathMatch {
  const CareerPathMatch({
    required this.careerPathId,
    required this.careerPathName,
    required this.offers,
    required this.averageMatchScore,
    required this.highQualityMatches,
    required this.totalOffersInCategory,
    this.dataQualityWarning,
  });

  final String careerPathId;
  final String careerPathName;
  final List<ScoredJobOffer> offers;
  final double averageMatchScore;
  final int highQualityMatches;
  final int totalOffersInCategory;
  final String? dataQualityWarning;

  factory CareerPathMatch.fromJson(Map json) => CareerPathMatch(
    careerPathId: _s(json['careerPathId']),
    careerPathName: _s(json['careerPathName']),
    offers: _list(json['matchedOffers'], ScoredJobOffer.fromJson),
    averageMatchScore: (json['averageMatchScore'] as num?)?.toDouble() ?? 0,
    highQualityMatches: (json['highQualityMatches'] as num?)?.toInt() ?? 0,
    totalOffersInCategory:
        (json['totalOffersInCategory'] as num?)?.toInt() ?? 0,
    dataQualityWarning: json['dataQualityWarning'] as String?,
  );
}

enum MatchConfidence {
  high('Wysoka pewność'),
  medium('Średnia pewność'),
  low('Niska pewność'),
  veryLow('B. niska pewność');

  const MatchConfidence(this.label);
  final String label;

  static MatchConfidence parse(Object? raw) => switch ('$raw') {
    'high' => high,
    'low' => low,
    'very_low' => veryLow,
    _ => medium,
  };
}

class ScoredJobOffer {
  const ScoredJobOffer({
    required this.id,
    required this.title,
    required this.companyName,
    required this.url,
    required this.category,
    required this.description,
    required this.locations,
    required this.matchScore,
    required this.confidence,
    required this.matchedSkills,
    required this.missingSkills,
    this.salaryMin,
    this.salaryMax,
    this.salaryCurrency,
    this.publishedAt,
  });

  final String id;
  final String title;
  final String companyName;
  final String url;
  final String category;

  /// Plain text; the API sends a short HTML snippet.
  final String description;
  final List<String> locations;
  final int matchScore;
  final MatchConfidence confidence;
  final List<String> matchedSkills;
  final List<String> missingSkills;
  final double? salaryMin;
  final double? salaryMax;
  final String? salaryCurrency;
  final DateTime? publishedAt;

  factory ScoredJobOffer.fromJson(Map json) {
    final details = json['matchDetails'] is Map
        ? json['matchDetails'] as Map
        : const {};
    return ScoredJobOffer(
      id: _s(json['id']),
      title: _s(json['title']),
      companyName: _s(json['companyName']),
      url: _s(json['url']),
      category: _s(json['category']),
      description: _stripHtml(_s(json['briefDescription'])),
      locations: _strings(json['locations']),
      matchScore: (json['matchScore'] as num?)?.toInt() ?? 0,
      confidence: MatchConfidence.parse(json['confidenceLevel']),
      matchedSkills: _strings(details['userMatchedSkills']),
      missingSkills: _strings(details['missingSkills']),
      salaryMin: (json['salaryMin'] as num?)?.toDouble(),
      salaryMax: (json['salaryMax'] as num?)?.toDouble(),
      salaryCurrency: json['salaryCurrency'] as String?,
      publishedAt: DateTime.tryParse(_s(json['publishedAt']))?.toLocal(),
    );
  }

  static String _stripHtml(String html) => html
      .replaceAll(RegExp(r'<[^>]*>'), ' ')
      .replaceAll(RegExp(r'&nbsp;'), ' ')
      .replaceAll(RegExp(r'&amp;'), '&')
      .replaceAll(RegExp(r'\s+'), ' ')
      .trim();
}

String _s(Object? v) => v == null ? '' : '$v';

List<String> _strings(Object? v) => v is List
    ? v.map((e) => '$e'.trim()).where((e) => e.isNotEmpty).toList()
    : const [];

List<T> _list<T>(Object? v, T Function(Map) fromJson) =>
    v is List ? v.whereType<Map>().map(fromJson).toList() : <T>[];
