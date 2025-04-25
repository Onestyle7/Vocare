import 'package:flutter/material.dart';
import 'package:vocare/screens/fill_profile_screen.dart';
import 'package:vocare/services/ai_api.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';

class AIAsistentPageScreen extends StatefulWidget {
  const AIAsistentPageScreen({super.key});

  @override
  State<AIAsistentPageScreen> createState() => _AIAsistentPageScreenState();
}

class _AIAsistentPageScreenState extends State<AIAsistentPageScreen> {
  final TextEditingController _recommendationController =
      TextEditingController();

  void _getRecommendation() async {
    final result = await AiApi.fetchRecommendation();
    setState(() {
      _recommendationController.text = result;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Positioned(
              left: 100,
              top: 928,
              child: Text("Vocare", style: TextStyle(fontSize: 55)),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: _getRecommendation,
              child: Text("Generuj rekomendację AI"),
            ),
            SizedBox(height: 16),
            TextFormField(
              controller: _recommendationController,
              maxLines: 10,
              decoration: InputDecoration(
                labelText: "Rekomendacja AI",
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(25),
                ),
              ),
              readOnly: true,
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        height: 60,
        decoration: BoxDecoration(
          color: Colors.black87,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(16),
            topRight: Radius.circular(16),
          ),
        ),
        child: SafeArea(
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
    );
  }
}
