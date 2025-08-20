class IndustrySection {
  final String industry;
  final String averageSalary;
  final int employmentRate;
  final String growthForecast;

  IndustrySection({
    required this.industry,
    required this.averageSalary,
    required this.employmentRate,
    required this.growthForecast,
  });

  factory IndustrySection.fromJson(Map<String, dynamic> json) {
    return IndustrySection(
      industry: json['industry'] ?? '',
      averageSalary: json['averageSalary'] ?? '',
      employmentRate: json['employmentRate'] ?? 0,
      growthForecast: json['growthForecast'] ?? '',
    );
  }
}
