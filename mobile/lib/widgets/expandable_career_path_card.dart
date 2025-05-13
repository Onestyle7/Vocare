import 'package:flutter/material.dart';
import 'package:vocare/models/ai_career_response.dart';

class ExpandableCareerPathCard extends StatelessWidget {
  final CareerPath careerPath;

  const ExpandableCareerPathCard({super.key, required this.careerPath});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: const Color(0xFF1C1C1E),
      margin: const EdgeInsets.symmetric(vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        title: Text(
          careerPath.careerName,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        subtitle: Text(
          "Prawdopodobieństwo: ${(careerPath.probability * 100).toStringAsFixed(1)}%",
          style: const TextStyle(color: Colors.purpleAccent),
        ),
        iconColor: Colors.purpleAccent,
        collapsedIconColor: Colors.purpleAccent,
        children: [
          _buildSection("📝 Opis", careerPath.description),
          _buildList("🔧 Wymagane umiejętności", careerPath.requiredSkills),
          _buildList("🎓 Rekomendowane kursy", careerPath.recommendedCourses),
          _buildList("📊 Analiza rynku", careerPath.marketAnalysis),
          _buildList("💪 Mocne strony", careerPath.swot.strengths),
          _buildList("📉 Słabości", careerPath.swot.weaknesses),
          _buildList("🚀 Szanse", careerPath.swot.opportunities),
          _buildList("⚠️ Zagrożenia", careerPath.swot.threats),
        ],
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Text(
        "$title\n$content",
        style: const TextStyle(color: Colors.white70),
      ),
    );
  }

  Widget _buildList(String title, List<String> items) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          ...items.map(
            (e) => Text("• $e", style: const TextStyle(color: Colors.white70)),
          ),
        ],
      ),
    );
  }
}
