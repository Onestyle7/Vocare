import 'package:flutter/material.dart';
import 'package:vocare/screens/fill_profile_screen.dart';
import 'package:vocare/services/ai_api.dart';
import 'package:vocare/widgets/nav_bar_button.dart';
import 'package:vocare/widgets/theme_toggle_button.dart';

class HomePageScreen extends StatefulWidget {
  const HomePageScreen({super.key});

  @override
  State<HomePageScreen> createState() => _HomePageScreenState();
}

class _HomePageScreenState extends State<HomePageScreen> {
  final TextEditingController _recommendationController = TextEditingController();

  void _getRecommendation() async {
    final result = await AiApi.fetchRecommendation();
    setState(() {
      _recommendationController.text = result;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
    appBar: AppBar(
  automaticallyImplyLeading: false, // usuwa strzałkę "wstecz"
  title: null, // brak tekstu
  centerTitle: true,
  toolbarHeight: 60,
  backgroundColor: Theme.of(context).appBarTheme.backgroundColor,
  flexibleSpace: SafeArea(
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 75),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: const [
          ThemeToggleButton(),
          NavBarButtons(destinations: [
            NavDestination.home,
            NavDestination.profile,
            NavDestination.logout,
          ]),
        ],
      ),
    ),
  ),
),

      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [Positioned(
              left: 100,
              top: 928,
              child: Text(
                "Vocare",
                style: TextStyle(fontSize: 55),
              ),
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
    );
  }
}
