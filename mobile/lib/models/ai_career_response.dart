class AiCareerResponse {
  final MainRecommendation recommendation;
  final List<CareerPath> careerPaths;

  AiCareerResponse({required this.recommendation, required this.careerPaths});

  factory AiCareerResponse.fromJson(Map<String, dynamic> json) {
    return AiCareerResponse(
      recommendation: MainRecommendation.fromJson(json['recommendation']),
      careerPaths:
          (json['careerPaths'] as List)
              .map((e) => CareerPath.fromJson(e))
              .toList(),
    );
  }

  // 🆕 Getter dla głównej rekomendacji (pierwszy element z listy)
  CareerPath? get mainCareerPath =>
      careerPaths.isNotEmpty ? careerPaths.first : null;

  // 🆕 Getter zwracający 3 dodatkowe rekomendacje (elementy 1, 2, 3)
  List<CareerPath> get additionalCareerPaths =>
      careerPaths.length > 1
          ? careerPaths.skip(1).take(3).toList()
          : <CareerPath>[];

  // 🆕 Getter zwracający wszystkie 4 rekomendacje
  List<CareerPath> get allCareerPaths => careerPaths.take(4).toList();
}

class MainRecommendation {
  final String careerName;
  final String justification;
  final List<String> nextSteps;
  final String longTermGoal;

  MainRecommendation({
    required this.careerName,
    required this.justification,
    required this.nextSteps,
    required this.longTermGoal,
  });

  factory MainRecommendation.fromJson(Map<String, dynamic> json) {
    return MainRecommendation(
      careerName: json['careerName'] ?? '',
      justification: json['justification'] ?? '',
      nextSteps: List<String>.from(json['nextSteps'] ?? []),
      longTermGoal: json['longTermGoal'] ?? '',
    );
  }
}

class CareerPath {
  final String careerName;
  final String description;
  final double probability;
  final List<String> requiredSkills;
  final List<String> recommendedCourses;
  final List<String> marketAnalysis;
  final SwotAnalysis swot;

  CareerPath({
    required this.careerName,
    required this.description,
    required this.probability,
    required this.requiredSkills,
    required this.recommendedCourses,
    required this.marketAnalysis,
    required this.swot,
  });

  factory CareerPath.fromJson(Map<String, dynamic> json) {
    return CareerPath(
      careerName: json['careerName'] ?? '',
      description: json['description'] ?? '',
      probability: (json['probability'] ?? 0).toDouble(),
      requiredSkills: List<String>.from(json['requiredSkills'] ?? []),
      recommendedCourses: List<String>.from(json['recommendedCourses'] ?? []),
      marketAnalysis: List<String>.from(json['marketAnalysis'] ?? []),
      swot: SwotAnalysis.fromJson(json['swot'] ?? {}),
    );
  }
}

class SwotAnalysis {
  final List<String> strengths;
  final List<String> weaknesses;
  final List<String> opportunities;
  final List<String> threats;

  SwotAnalysis({
    required this.strengths,
    required this.weaknesses,
    required this.opportunities,
    required this.threats,
  });

  factory SwotAnalysis.fromJson(Map<String, dynamic> json) {
    return SwotAnalysis(
      strengths: List<String>.from(json['strengths'] ?? []),
      weaknesses: List<String>.from(json['weaknesses'] ?? []),
      opportunities: List<String>.from(json['opportunities'] ?? []),
      threats: List<String>.from(json['threats'] ?? []),
    );
  }
}
