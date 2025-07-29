class MarketTrend {
  final String trendName;
  final String description;
  final String impact;

  MarketTrend({
    required this.trendName,
    required this.description,
    required this.impact,
  });

  factory MarketTrend.fromJson(Map<String, dynamic> json) {
    return MarketTrend(
      trendName: json['trendName'] ?? '',
      description: json['description'] ?? '',
      impact: json['impact'] ?? '',
    );
  }
}
