import 'package:flutter/material.dart';
import 'package:vocare/models/ai_career_response.dart';

class ExpandableCareerPathCard extends StatelessWidget {
  final CareerPath careerPath;
  final bool isMainRecommendation;
  final int? number;
  final MainRecommendation? mainRecommendation;

  const ExpandableCareerPathCard({
    super.key,
    required this.careerPath,
    this.isMainRecommendation = false,
    this.number,
    this.mainRecommendation,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: number != null ? _buildNumberedCard() : _buildClassicCard(),
    );
  }

  // Karta z numerem - naprawiona
  Widget _buildNumberedCard() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1E),
        borderRadius: BorderRadius.circular(12),
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch, // 🆕 DODANE
          children: [
            // Pasek z numerem - pełna wysokość
            Container(
              width: 50,
              decoration: const BoxDecoration(
                color: Color(0xFF915EFF),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(12),
                  bottomLeft: Radius.circular(12),
                ),
              ),
              child: Center(
                // 🔧 ZMIENIONE z Column na Center
                child: Column(
                  mainAxisSize: MainAxisSize.min, // 🆕 DODANE
                  children: [
                    Text(
                      '$number',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    if (isMainRecommendation) ...[
                      const SizedBox(height: 2),
                      const Icon(Icons.star, color: Colors.amber, size: 16),
                    ],
                  ],
                ),
              ),
            ),

            // Zawartość karty - bez ExpansionTile
            Expanded(
              child: Container(
                // 🔧 ZMIENIONE z ExpansionTile na Container
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min, // 🆕 DODANE
                  children: [
                    // Title
                    _buildTitle(),
                    const SizedBox(height: 8),

                    // Subtitle
                    _buildSubtitle(),
                    const SizedBox(height: 12),

                    // Content w ScrollView
                    ConstrainedBox(
                      constraints: const BoxConstraints(
                        maxHeight: 200,
                      ), // 🆕 Ograniczona wysokość
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: _buildContentWidgets(),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Klasyczna karta - naprawiona
  Widget _buildClassicCard() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1E),
        borderRadius: BorderRadius.circular(12),
        border:
            isMainRecommendation
                ? Border.all(color: Colors.amber, width: 2)
                : null,
        boxShadow:
            isMainRecommendation
                ? [
                  BoxShadow(
                    color: Colors.amber.withOpacity(0.2),
                    blurRadius: 8,
                    spreadRadius: 1,
                  ),
                ]
                : null,
      ),
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch, // 🆕 DODANE
          children: [
            Container(
              width: 40,
              decoration: const BoxDecoration(
                color: Color(0xFF915EFF),
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(12),
                  bottomLeft: Radius.circular(12),
                ),
              ),
              child:
                  isMainRecommendation
                      ? const Center(
                        child: Icon(Icons.star, color: Colors.amber, size: 24),
                      )
                      : null,
            ),
            Expanded(
              child: Container(
                // 🔧 ZMIENIONE z ExpansionTile na Container
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min, // 🆕 DODANE
                  children: [
                    // Title
                    _buildTitle(),
                    const SizedBox(height: 8),

                    // Subtitle
                    _buildSubtitle(),
                    const SizedBox(height: 12),

                    // Content w ScrollView
                    ConstrainedBox(
                      constraints: const BoxConstraints(
                        maxHeight: 200,
                      ), // 🆕 Ograniczona wysokość
                      child: SingleChildScrollView(
                        physics: const BouncingScrollPhysics(),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: _buildContentWidgets(),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Uproszczony title - bez Row
  Widget _buildTitle() {
    return Text(
      number != null && isMainRecommendation
          ? "Main Recommendation"
          : number != null && !isMainRecommendation
          ? "Proponowana ścieżka kariery"
          : careerPath.careerName,
      style: const TextStyle(
        fontWeight: FontWeight.bold,
        color: Colors.white,
        fontSize: 16,
      ),
      maxLines: 2, // 🆕 Ograniczone linie
      overflow: TextOverflow.ellipsis,
    );
  }

  // Uproszczony subtitle
  Widget _buildSubtitle() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min, // 🆕 DODANE
      children: [
        if (number != null) ...[
          Text(
            careerPath.careerName,
            style: const TextStyle(
              color: Colors.purpleAccent,
              fontSize: 14, // 🔧 Zmniejszone z 16
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1, // 🆕 Ograniczone linie
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
        ],
        if (isMainRecommendation) ...[
          const Text(
            "🏆 GŁÓWNA REKOMENDACJA",
            style: TextStyle(
              color: Colors.amber,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 4),
        ],
        Text(
          "Prawdopodobieństwo: ${careerPath.probability.toStringAsFixed(1)}%",
          style: const TextStyle(
            color: Colors.purpleAccent,
            fontSize: 12, // 🔧 Zmniejszone
          ),
        ),
      ],
    );
  }

  // Zawartość - skrócona
  List<Widget> _buildContentWidgets() {
    List<Widget> widgets = [];

    if (isMainRecommendation && mainRecommendation != null) {
      widgets.addAll([
        _buildSectionWidget(
          "🎯 Uzasadnienie",
          mainRecommendation!.justification,
        ),
        _buildListWidget(
          "🪜 Następne kroki",
          mainRecommendation!.nextSteps.take(3).toList(),
        ), // 🔧 Ograniczone do 3
        _buildSectionWidget(
          "🚀 Cel długoterminowy",
          mainRecommendation!.longTermGoal,
        ),
      ]);
    }

    widgets.addAll([
      _buildSectionWidget("📝 Opis", careerPath.description),
      _buildListWidget(
        "🔧 Wymagane umiejętności",
        careerPath.requiredSkills.take(5).toList(),
      ), // 🔧 Ograniczone do 5
      _buildListWidget(
        "🎓 Rekomendowane kursy",
        careerPath.recommendedCourses.take(3).toList(),
      ), // 🔧 Ograniczone do 3
    ]);

    return widgets;
  }

  Widget _buildSectionWidget(String title, String content) {
    if (content.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 8), // 🔧 Zmniejszone z 12
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14, // 🔧 Zmniejszone
            ),
          ),
          const SizedBox(height: 4),
          Text(
            content,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12, // 🔧 Zmniejszone
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildListWidget(String title, List<String> items) {
    if (items.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 8), // 🔧 Zmniejszone z 12
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14, // 🔧 Zmniejszone
            ),
          ),
          const SizedBox(height: 4),
          ...items.map(
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 2),
              child: Text(
                "• $item",
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 12, // 🔧 Zmniejszone
                ),
                maxLines: 2, //
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
