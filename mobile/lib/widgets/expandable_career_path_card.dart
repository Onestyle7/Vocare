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

  // 🆕 Karta z numerem - PRZEPISANA BEZ OVERFLOW - OSTATECZNA WERSJA
  Widget _buildNumberedCard() {
    return Container(
      margin: const EdgeInsets.symmetric(vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFF1C1C1E),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          // 🔢 Pasek z numerem z lewej strony - STAŁA WYSOKOŚĆ
          Container(
            width: 50,
            height: 80, // 🔧 STAŁA WYSOKOŚĆ - zapobiega overflow
            decoration: const BoxDecoration(
              color: Color(0xFF915EFF),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                bottomLeft: Radius.circular(12),
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$number',
                  style: const TextStyle(
                    fontSize: 24, // 🔧 Zmniejszona czcionka
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                if (isMainRecommendation) ...[
                  const SizedBox(height: 2),
                  const Icon(
                    Icons.star,
                    color: Colors.amber,
                    size: 16,
                  ), // 🔧 Mniejsza gwiazdka
                ],
              ],
            ),
          ),

          // Zawartość karty - ZABEZPIECZONA przed overflow
          Expanded(
            child: ExpansionTile(
              tilePadding: const EdgeInsets.symmetric(
                horizontal: 12, // 🔧 Zmniejszony padding
                vertical: 8,
              ),
              childrenPadding: EdgeInsets.zero,
              iconColor: Colors.purpleAccent,
              collapsedIconColor: Colors.purpleAccent,
              title: _buildTitle(),
              subtitle: _buildSubtitle(),
              children: [
                // 🔧 KLUCZ: Maksymalna wysokość z przewijaniem
                Container(
                  constraints: const BoxConstraints(
                    maxHeight: 300, // 🔧 Maksymalna wysokość
                  ),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(12), // 🔧 Zmniejszony padding
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: _buildContentWidgets(),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 🔄 Klasyczna karta - TEŻ PRZEPISANA
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
      child: Row(
        children: [
          Container(
            width: 40,
            height: 80, // 🔧 STAŁA WYSOKOŚĆ
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
            child: ExpansionTile(
              tilePadding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 8,
              ),
              childrenPadding: EdgeInsets.zero,
              iconColor: Colors.purpleAccent,
              collapsedIconColor: Colors.purpleAccent,
              title: _buildTitle(),
              subtitle: _buildSubtitle(),
              children: [
                Container(
                  constraints: const BoxConstraints(maxHeight: 300),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: _buildContentWidgets(),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // 🎯 Wspólny tytuł
  Widget _buildTitle() {
    return Row(
      children: [
        if (isMainRecommendation) ...[
          const Icon(Icons.star, color: Colors.amber, size: 20),
          const SizedBox(width: 8),
        ],
        Expanded(
          child: Text(
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
            overflow: TextOverflow.ellipsis, // 🔧 Zapobiega overflow tekstu
          ),
        ),
      ],
    );
  }

  // 🎯 Wspólny subtitle
  Widget _buildSubtitle() {
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (number != null) ...[
            Text(
              careerPath.careerName,
              style: const TextStyle(
                color: Colors.purpleAccent,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
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
            style: const TextStyle(color: Colors.purpleAccent),
          ),
        ],
      ),
    );
  }

  // 🎯 Zawartość jako lista widgetów - PRZEPISANA
  List<Widget> _buildContentWidgets() {
    List<Widget> widgets = [];

    if (isMainRecommendation && mainRecommendation != null) {
      widgets.addAll([
        _buildSectionWidget(
          "🎯 Uzasadnienie",
          mainRecommendation!.justification,
        ),
        _buildListWidget("🪜 Następne kroki", mainRecommendation!.nextSteps),
        _buildSectionWidget(
          "🚀 Cel długoterminowy",
          mainRecommendation!.longTermGoal,
        ),
        const Divider(color: Colors.grey),
      ]);
    }

    widgets.addAll([
      _buildSectionWidget("📝 Opis", careerPath.description),
      _buildListWidget("🔧 Wymagane umiejętności", careerPath.requiredSkills),
      _buildListWidget("🎓 Rekomendowane kursy", careerPath.recommendedCourses),
      _buildListWidget("📊 Analiza rynku", careerPath.marketAnalysis),
      const Divider(color: Colors.grey),
      const Text(
        "📈 Analiza SWOT",
        style: TextStyle(
          color: Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: 16,
        ),
      ),
      const SizedBox(height: 8),
      _buildListWidget("💪 Mocne strony", careerPath.swot.strengths),
      _buildListWidget("📉 Słabości", careerPath.swot.weaknesses),
      _buildListWidget("🚀 Szanse", careerPath.swot.opportunities),
      _buildListWidget("⚠️ Zagrożenia", careerPath.swot.threats),
    ]);

    return widgets;
  }

  Widget _buildSectionWidget(String title, String content) {
    if (content.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        mainAxisSize: MainAxisSize.min, // 🔧 KLUCZ: mainAxisSize.min
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
          Text(content, style: const TextStyle(color: Colors.white70)),
        ],
      ),
    );
  }

  Widget _buildListWidget(String title, List<String> items) {
    if (items.isEmpty) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        mainAxisSize: MainAxisSize.min, // 🔧 KLUCZ: mainAxisSize.min
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
            (item) => Padding(
              padding: const EdgeInsets.only(bottom: 2),
              child: Text(
                "• $item",
                style: const TextStyle(color: Colors.white70),
                overflow: TextOverflow.clip, // 🔧 Zapobiega overflow
              ),
            ),
          ),
        ],
      ),
    );
  }
}
