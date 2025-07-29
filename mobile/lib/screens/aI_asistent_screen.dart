import 'package:flutter/material.dart';
import 'package:vocare/models/ai_career_response.dart';
import 'package:vocare/services/ai_api.dart';
import 'package:vocare/widgets/custom_button.dart';
import 'package:vocare/widgets/expandable_career_path_card.dart';
import 'package:vocare/widgets/main_recommendation_card.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';

class AIAsistentPageScreen extends StatefulWidget {
  const AIAsistentPageScreen({super.key});

  @override
  State<AIAsistentPageScreen> createState() => _AIAsistentPageScreenState();
}

class _AIAsistentPageScreenState extends State<AIAsistentPageScreen> {
  bool _loading = false;
  AiCareerResponse? _recommendation;

  Future<void> _loadRecommendation() async {
    setState(() => _loading = true);
    final result = await AiApi.fetchFullRecommendation();
    setState(() {
      _loading = false;
      _recommendation = result;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Assistant"),
        backgroundColor: Colors.black87,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
        actions: const [ThemeToggleButton()],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: ListView(
            children: [
              if (_recommendation != null) ...[
                MainRecommendationCard(
                  recommendation: _recommendation!.recommendation,
                ),
                ExpandableCareerPathCard(
                  careerPath: _recommendation!.careerPaths[0],
                ),
                ExpandableCareerPathCard(
                  careerPath: _recommendation!.careerPaths[1],
                ),
                ExpandableCareerPathCard(
                  careerPath: _recommendation!.careerPaths[2],
                ),
              ],
              const SizedBox(height: 16),
              _loading
                  ? const Center(child: CircularProgressIndicator())
                  : CustomButton(
                    text: "Generate new recommendation",
                    onPressed: _loadRecommendation,
                  ),
            ],
          ),
        ),
      ),
    );
  }
}
