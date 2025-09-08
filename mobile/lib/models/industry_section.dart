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
    // 🔧 PROSTA OBSŁUGA minSalary/maxSalary
    String formattedSalary;

    if (json.containsKey('minSalary') && json.containsKey('maxSalary')) {
      final int minSal = json['minSalary'] ?? 0;
      final int maxSal = json['maxSalary'] ?? 0;

      if (minSal > 0 && maxSal > 0) {
        // Prosty format bez formatowania liczb
        formattedSalary = '\$${minSal.toString()} - \$${maxSal.toString()}';
      } else {
        formattedSalary = json['averageSalary']?.toString() ?? 'Brak danych';
      }
    } else {
      formattedSalary = json['averageSalary']?.toString() ?? 'Brak danych';
    }

    return IndustrySection(
      industry: json['industry']?.toString() ?? '',
      averageSalary: formattedSalary,
      employmentRate: json['employmentRate'] ?? 0,
      growthForecast: json['growthForecast']?.toString() ?? '',
    );
  }
}
