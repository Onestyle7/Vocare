import 'package:flutter/material.dart';
import 'package:vocare/screens/fill_profile_screen.dart';
import 'package:vocare/services/ai_api.dart';

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
        title: Text("Strona główna"),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Text("To jest strona Home"),
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
                border: OutlineInputBorder(),
              ),
              readOnly: true,
            ),
            SizedBox(height: 16),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => FillProfileScreen()),
                );
              },
              child: Text("Profil"),
            ),
          ],
        ),
      ),
    );
  }
}
