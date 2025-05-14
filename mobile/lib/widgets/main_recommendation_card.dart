import 'package:flutter/material.dart';
import 'package:vocare/models/ai_career_response.dart';

class MainRecommendationCard extends StatelessWidget {
  final MainRecommendation recommendation;

  const MainRecommendationCard({super.key, required this.recommendation});

  @override
  Widget build(BuildContext context) {
    return Card(
      color: const Color(0xFF1C1C1E),
      margin: const EdgeInsets.symmetric(vertical: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              recommendation.careerName,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.purpleAccent,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              "📌 Uzasadnienie:\n${recommendation.justification}",
              style: const TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 12),
            Text(
              "🪜 Następne kroki:",
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            ...recommendation.nextSteps.map(
              (step) => Text(
                "• $step",
                style: const TextStyle(color: Colors.white70),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              "🎯 Cel długoterminowy:\n${recommendation.longTermGoal}",
              style: const TextStyle(color: Colors.white70),
            ),
          ],
        ),
      ),
    );
  }
}
