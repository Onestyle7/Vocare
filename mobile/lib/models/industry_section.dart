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
    // 🔧 POPRAWIONA OBSŁUGA minSalary/maxSalary z nowego JSON-a
    String formattedSalary;

    if (json.containsKey('minSalary') && json.containsKey('maxSalary')) {
      final int minSal = json['minSalary'] ?? 0;
      final int maxSal = json['maxSalary'] ?? 0;

      if (minSal > 0 && maxSal > 0) {
        // 🔧 LEPSZE FORMATOWANIE z przecinkami i PLN
        formattedSalary =
            '${_formatNumber(minSal)} - ${_formatNumber(maxSal)} PLN';
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

  // 🔧 HELPER: Formatowanie liczb z separatorami
  static String _formatNumber(int number) {
    return number.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match match) => '${match[1]} ',
    );
  }
}
