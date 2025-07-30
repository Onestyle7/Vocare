class SkillDemand {
  final String skill;
  final String demandLevel;
  final String industry;

  SkillDemand({
    required this.skill,
    required this.demandLevel,
    required this.industry,
  });

  factory SkillDemand.fromJson(Map<String, dynamic> json) {
    return SkillDemand(
      skill: json['skill'] ?? '',
      demandLevel: json['demandLevel'] ?? '',
      industry: json['industry'] ?? '',
    );
  }
}
