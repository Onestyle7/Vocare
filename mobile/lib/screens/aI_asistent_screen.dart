import 'package:flutter/material.dart';
import 'package:vocare/models/ai_career_response.dart';
import 'package:vocare/services/ai_api.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/main_recommendation_card.dart';
import 'package:vocare/widgets/expandable_career_path_card.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';

class AIAsistentPageScreen extends StatefulWidget {
  const AIAsistentPageScreen({super.key});

  @override
  State<AIAsistentPageScreen> createState() => _AIAsistentPageScreenState();
}

class _AIAsistentPageScreenState extends State<AIAsistentPageScreen> {
  AiCareerResponse? _careerResponse;
  bool _loading = false;

  Future<void> _loadRecommendation() async {
    setState(() => _loading = true);
    final result = await AiApi.fetchFullRecommendation();
    setState(() {
      _careerResponse = result;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.black87,
        automaticallyImplyLeading: false,
        toolbarHeight: 60,
        flexibleSpace: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: const [
                ThemeToggleButton(),
                NavBarButtons(
                  destinations: [
                    NavDestination.home,
                    NavDestination.profile,
                    NavDestination.logout,
                    NavDestination.assistent,
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child:
              _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _careerResponse == null
                  ? Center(
                    child: CustomButton(
                      text: "Generuj rekomendację AI",
                      onPressed: _loadRecommendation,
                    ),
                  )
                  : SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          "🎯 Główna rekomendacja",
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 12),
                        MainRecommendationCard(
                          recommendation: _careerResponse!.recommendation,
                        ),
                        const SizedBox(height: 24),
                        const Text(
                          "💼 Alternatywne ścieżki kariery",
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ..._careerResponse!.careerPaths
                            .take(3)
                            .map(
                              (path) =>
                                  ExpandableCareerPathCard(careerPath: path),
                            ),
                      ],
                    ),
                  ),
        ),
      ),
    );
  }
}
